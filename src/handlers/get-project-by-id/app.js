const { getParameterFromSsm } = require('/opt/nodejs/ssm_utils');
const log = require('lambda-log');
const { Octokit } = require("@octokit/rest");
const AWSXRay = require('aws-xray-sdk-core');
AWSXRay.captureHTTPsGlobal(require('https'));
const https = require('https');

const captureMySQL = require('aws-xray-sdk-mysql');
const mysql = captureMySQL(require('mysql2/promise'));

if (process.env.AWS_SAM_LOCAL) {
    AWSXRay.setContextMissingStrategy("IGNORE_ERROR");
}

const dbPasswordPromise = getParameterFromSsm("/global/serverless-bugtracker/db-password");
const githubTokenPromise = getParameterFromSsm("/global/serverless-bugtracker/github-token");
const githubPromise = githubTokenPromise.then(token => {
    return new Octokit({
        auth: token,
        request: {
            agent: new https.Agent({ keepAlive: true })
        }
    });
});

var dbPassword;
var dbConnection;

exports.lambdaHandler = async (event, context) => {
    const projectId = event.pathParameters.projectId;
    try {
        if(!dbConnection) {
            dbPassword = await dbPasswordPromise;
            dbConnection = await mysql.createConnection({
                database: process.env.DB_NAME,
                host: process.env.HOST,
                user: process.env.LOGIN,
                password: dbPassword
            });
        }
        const [rows, fields] = await dbConnection.execute("SELECT * FROM `projects` where `id` = ?", [projectId]);
        var response = {
            statusCode: 404,
            body: {}
        };
        if (rows.length == 1) {
            response.statusCode = 200;
            response.body = JSON.stringify(rows[0]);
        }

        const project = rows[0];
        const owner = project['github_owner'];

        const xraySegement = AWSXRay.getSegment();
        var subsegment = xraySegement.addNewSubsegment('get-pull-requests');

        const { data: prInfo } = await listPullRequests(owner, project['github_repo']);
        project.openPullRequests = fillPullRequestsResponseInfo(prInfo);
        
        subsegment.close();
        return {
            statusCode: 200,
            body: JSON.stringify(project)
        };
    } catch (err) {
        log.error("Cannot retrieve project by id", err);
        var errorResponse = {
            msg: err.message
        }
        return {
            statusCode: 500,
            body: JSON.stringify(errorResponse)
        }
    }
};

async function listPullRequests(projectOwner, projectRepo) {
    const githubClient = await githubPromise;
    return githubClient.rest.pulls.list({
        owner: projectOwner,
        repo: projectRepo,
        state: 'open'
    });
}

function fillPullRequestsResponseInfo(pullRequests) {
    const response = [];
    pullRequests.forEach(pr => {
        response.push({
            url: pr.url,
            title: pr.title,
            user: pr.user.login,
            body: pr.body
        });
    });
    return response;
}