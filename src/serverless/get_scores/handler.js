const mysql = require('mysql');
const knex = require('knex')({
    client: require('knex-serverless-mysql'),
});

let connDB;

module.exports.handler = async function(event) {
    try {
        return await getScores(event);
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Something went wrong' }),
        };
    } finally {
        if (connDB) {
            connDB.destroy();
        }
    }
};

const getScores = async event => {
    if (!event.queryStringParameters || !event.queryStringParameters.limit) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Missing query params' }),
        };
    }

    if (event.queryStringParameters.orderBy && event.queryStringParameters.orderBy !== 'TimeCreated') {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Can only order by time created or none' }),
        };
    }

    const {queryStringParameters: {limit, orderBy}} = event;

    if (!connDB) {
        connDB = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_USER,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            charset: 'utf8_general_ci',
            connectTimeout: 1000,
        });
    }

    const query = knex('Scores').select();

    if (orderBy === 'TimeCreated') {
        query.orderBy('TimeSubmitted');
    } else {
        query.orderBy('Score', 'TimeTaken');
    }

    query.limit(limit);

    const results = await new Promise(
        (res, rej) => connDB.query(
            query.toString(),
            (err, rows) => err ? rej(err) : res(rows),
        ),
    );

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ results }),
    };
};
