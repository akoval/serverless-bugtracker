const { createConnection } = require('mysql2/promise');
const { getParameterFromSsm } = require('/opt/nodejs/ssm_utils');

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
        const [rows, fields] = await dbConnection.execute("SELECT * FROM `projects` where `id` = ?", [event.id]);
        var response = {
            statusCode: 404,
            body: {}
        };
        if (rows.length == 1) {
            response.statusCode = 200;
            response.body = JSON.stringify(rows[0]);
        }
        return response;
    } catch (err) {
        console.log("Cannot retrieve project by id.", err);
        var errorResponse = {
            msg: err.message
        }
        return {
            statusCode: 500,
            body: JSON.stringify(errorResponse)
        }
    }
}