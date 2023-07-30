const AWS = require('./AWS');

// Create an S3 instance
const s3 = new AWS.S3();

// Function to list files in a folder
function listFilesInFolder(bucketName, folderPath) {
    const params = {
        Bucket: bucketName,
        Prefix: folderPath // Provide the folder path here
    };

    let images = [];

    s3.listObjectsV2(params, (err, data) => {
        if (err) {
            console.log('Error', err);
        } else {
            data.Contents.forEach((file) => {
                images.push(file.Key);
            });
        }
    });

    return images;
}

// Usage example
const bucketName = 'electric-il-register';
const folderPath = 'images';

module.exports = {
    listFiles : listFilesInFolder(bucketName, folderPath),
    bucketName,
    folderPath,
    s3
};