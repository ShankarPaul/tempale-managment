const serverless = require('serverless-http');
const app = require('../../src/app');

// Serverless handler for Netlify Functions
module.exports.handler = serverless(app);
