const { createConnection } = require('mysql2/promise');
const { getParameterFromSsm } = require('/opt/nodejs/ssm_utils');
const log = require('lambda-log');

const fetchParamsPromise = getParameterFromSsm("/global/serverless-bugtracker/db-password");
var dbPassword;
var dbConnection;

exports.lambdaHandler = async (event, context) => {
    try {
        if(!dbConnection) {
            dbPassword = await fetchParamsPromise;
            dbConnection = await createConnection({
                database: process.env.DB_NAME,
                host: process.env.HOST,
                user: process.env.LOGIN,
                password: dbPassword
            });
        }
        //TODO add some validation

        const [result] = await dbConnection.execute("DELETE FROM `project_team_members` WHERE project_id=? AND team_member_id=?",
        [event['project_id'], event['team_member_id']]);

        var response = {
            statusCode: 400,
            body: JSON.stringify({
                msg: "Cannot remove member"
            })
        };
        if (result.affectedRows == 1) {
            response.statusCode = 200;
            response.body = JSON.stringify({});
        }
        return response;
    } catch (err) {
        log.error("Cannot remove person from project", err);
        var errorResponse = {
            msg: err.message
        }
        return {
            statusCode: 500,
            body: JSON.stringify(errorResponse)
        }
    }
};
