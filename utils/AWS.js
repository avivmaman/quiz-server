const AWS = require('aws-sdk');

// Configure AWS SDK with your access credentials
AWS.config.update({
    accessKeyId: 'AKIAWAFGLGC6LCLFIISA',
    secretAccessKey: 'He5wzZ6SjfJJBYZZjJob6cvQRdTkkz9XMbFp5wmY',
    region: 'eu-central-1'
});

module.exports = AWS;