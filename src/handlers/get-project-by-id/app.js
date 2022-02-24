exports.lambdaHandler = async (event, context) => {
    var project = {
        id: 123,
        title: 'My first project',
        description: 'First project to work with serverless. No cards. No members.',
        cards: [],
        members: []
    };
    return project;
};