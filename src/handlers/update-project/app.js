const { createConnection } = require('mysql2/promise');
const { getParameterFromSsm } = require('/opt/nodejs/ssm_utils');

const fetchParamsPromise = getParameterFromSsm("/global/serverless-bugtracker/db-password");
var dbPassword;
var dbConnection;
exports.lambdaHandler = async (event, context) => {
    try {
        if (!dbConnection) {
            dbPassword = await fetchParamsPromise;
            dbConnection = await createConnection({
                database: process.env.DB_NAME,
                host: process.env.HOST,
                user: process.env.LOGIN,
                password: dbPassword
            });
        }
        const [result] = await dbConnection.execute("UPDATE projects SET title=?, github_repo=?, github_owner=? WHERE id = ?",
            [event['title'], event['github_repo'], event['github_owner'], event['project_id']]);
        var response = {
            statusCode: 400,
            body: JSON.stringify({
                msg: "Cannot update project."
            })
        };
        if (result.affectedRows == 1) {
            response.statusCode = 200;
            response.body = JSON.stringify(event);
        }
        return response;
    } catch (err) {
        console.log("Cannot update project", err);
        var errorResponse = {
            msg: err.message
        }
        return {
            statusCode: 500,
            body: JSON.stringify(errorResponse)
        }
    }

    return response
}
