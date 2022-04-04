jest.mock('mysql2/promise');
jest.mock('/opt/nodejs/ssm_utils');

const { createConnection } = require('mysql2/promise');
const app = require('../app.js');

beforeEach(() => {
    jest.clearAllMocks();
});

test('fetch non existing project returns 404', async () => {
    createConnection.mockReturnValue(Promise.resolve({
        execute: jest.fn(() => {
            return Promise.resolve([
                [],
                []
            ]);
        })
    }));
    expect(await app.lambdaHandler({ id: 123 })).toStrictEqual({
        statusCode: 404,
        body: {}
    });
});



test('fetch project if exists', async () => {
    const rowObject = {
        test: 123
    };
    createConnection.mockReturnValue(Promise.resolve({
        execute: jest.fn(() => {
            return Promise.resolve([
                [rowObject],
                []
            ]);
        })
    }));
    expect(await app.lambdaHandler({ id: 123 })).toStrictEqual({
        statusCode: 200,
        body: JSON.stringify(rowObject)
    });
});