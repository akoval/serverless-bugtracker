const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const log = require('lambda-log');
const util = require("util");
const client = new SSMClient({ region: "us-east-1" });

exports.getParameterFromSsm = async (parameter) => {
    log.info(util.format("Fetching %s from SSM...", parameter));
    try {
        const input = {
            Name: parameter,
            WithDecryption: true
        };
        const cmd = new GetParameterCommand(input);
        const result = await client.send(cmd);
        if (result.Parameter) {
            return result.Parameter.Value;
        }
        return result.Parameter;
    } catch (error) {
        log.error("Cannot fetch parameter", error);
        throw error;
    }
}