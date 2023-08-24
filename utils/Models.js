// Question Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    questionNumber: {
        type: Number,
        unique: true
    },
    questionImage: {
        type: String,
        required: true
    },
    questionDescription: {
        type: String,
    },
    answerDescription: {
        type: String,
    },
    answers: [{
        type: Number,
        required: true
    }],
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

// Category Model
const categorySchema = new Schema({
    categoryName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

// Category Model
const userTestsSchema = new Schema({
    uid: {
        type: String,
        required: true
    },
    testType: {
        type: String,
        default: 'main'
    },
    score: {
        type: Number,
        required: true
    },
    test: [{
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    }],
    answers: [{
        qid: {
            type: String,
            required: true
        },
        results:{
            type: Number,
            required: true
        }
    }]

}, { timestamps: true });

const UserTests = mongoose.model('UserTests', userTestsSchema);

module.exports = {
    Question,
    Category,
    UserTests
};