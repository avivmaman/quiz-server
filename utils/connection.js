const mongoose = require('mongoose');

const connectionURI = 'mongodb+srv://aviv1:aviv1@cluster0.mdrxje8.mongodb.net/quiz';

mongoose.connect(connectionURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


const db = mongoose.connection;

db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

db.once('open', () => {
    console.log('Connected to MongoDB');
});

module.exports = db;
