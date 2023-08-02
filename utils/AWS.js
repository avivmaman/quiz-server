const AWS = require('aws-sdk');

// Configure AWS SDK with your access credentials
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
    region: process.env.AWS_REGION
});

module.exports = AWS;