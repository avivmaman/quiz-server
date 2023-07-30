// Question Model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    questionImage: {
        type: String,
        required: true
    },
    answers: [{
        type: Number,
        required: true
    }],
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
});

const Question = mongoose.model('Question', questionSchema);

// Category Model
const categorySchema = new Schema({
    categoryName: {
        type: String,
        required: true
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = {
    Question,
    Category
};