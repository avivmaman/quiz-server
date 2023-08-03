const {Question, Category} = require("../../utils/Models");
const helper = require("../../utils/helper");
const mongoose = require("mongoose");
const getAllQuestions = async () => {
    const questionsQuery = await Question.find({}).sort({category: 1, questionNumber: 1}).populate('category');
    return helper.questionsDao(questionsQuery);
};

const getAllCategoryQuestions = async (category) => {
    const questionsQuery = await Question.find({ category }).populate('category');
    const randomizedQuestions = questionsQuery.sort(() => Math.random() - 0.5);
    return helper.questionsDao(randomizedQuestions);
};

const getCategoryTest = async (category) => {
    const questionsQuery = await getAllCategoryQuestions(category);
    if(questionsQuery.length < 20){
        return questionsQuery;
    }else{
        const randomizedQuestions = questionsQuery.sort(() => Math.random() - 0.5);
        return randomizedQuestions.slice(0, 20);
    }
};

const getQuestionsSplitByAllCategoriesCount = async (limit) => {
    let categoryIds = await Category.find({});
    categoryIds = categoryIds.map((cat) => cat._id);
    const totalQuestions = limit;
    const splitSize = Math.floor(totalQuestions / categoryIds.length);

    const results = await Question.aggregate([
        {
            $match: {
                category: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) }
            },
        },
        {
            $group: {
                _id: "$category",
                questions: { $push: "$$ROOT" }
            }
        },
        { $lookup: {from: 'categories', localField: 'category', foreignField: '_id', as: 'category'} },
    ]);
    const aggregatedQuestions = results.reduce((accumulator, category) => {
        // Randomize the questions within each category
        const randomizedQuestions = category.questions.sort(() => Math.random() - 0.5);
        // Split the questions according to the split size
        const splitQuestions = randomizedQuestions.slice(0, splitSize);
        accumulator.push(...splitQuestions);
        return accumulator;
    }, []);

    const remainingQuestions = totalQuestions - aggregatedQuestions.length;
    const remainingCategoryIds = categoryIds.filter(id =>
        !aggregatedQuestions.some(question => question.category.toString() === id)
    );

    // If there are remaining slots and categories available, add more questions
    if (remainingQuestions > 0) {
        const moreResults = await Question.aggregate([
            {
                $match: {
                    category: { $in: ["64b6cece36a40f550ba93f87", "64b6ce6236a40f550ba93c7d"].map(id => new mongoose.Types.ObjectId(id))}
                }
            },
            {
                $sample: { size: remainingQuestions }
            },
            { $lookup: {from: 'categories', localField: 'category', foreignField: '_id', as: 'category'} },
        ]);
        aggregatedQuestions.push(...moreResults);
    }
    return helper.questionsDao(aggregatedQuestions);
}

const getResultsOfAnsweredQuestions = async (results) => {
    const questions = await Question.find({ _id: { $in: results.map(result => result.id) } });
    return questions.map((question, index) => {
        const resultQuestion = results.find(i => i.id === question._id.toString());
        const isCorrect = question.answers.every((answer) => {
            return resultQuestion.answers.includes(answer);
        });
        let correctAnswer;
        let notCorrectAnswer;
        if(!isCorrect) {
            correctAnswer = question.answers.filter((answer) => !resultQuestion.answers.includes(answer));
            notCorrectAnswer = question.answers.filter((answer) => resultQuestion.answers.includes(answer));
        }
        return {
            question: helper.questionDao(question),
            isCorrect,
            correctAnswer,
            notCorrectAnswer,
        }
    });
}

const saveQuestion = async (question) => {
    const newQuestion = await Question.findById(question.id);
    newQuestion.answers = question.answers;
    newQuestion.answerDescription = question.answerDescription;
    newQuestion.questionDescription = question.questionDescription;
    await newQuestion.save();
}
const getAllQuestionsController = async (req, res) => {
    try{
        const allQuestions = await getAllQuestions();
        res.json(allQuestions);
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getAllCategoryQuestionsController = async (req, res) => {
    try{
        const allQuestions = await getAllCategoryQuestions(req.params.category);
        res.json(allQuestions);
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getCategoryTestController = async (req, res) => {
    try{
        const allQuestions = await getCategoryTest(req.params.category);
        res.json(allQuestions);
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getQuestionsSplitByAllCategoriesCountController = async (req, res) => {
    try {
        const aggregatedQuestions = await getQuestionsSplitByAllCategoriesCount(10);
        res.send({
            count : aggregatedQuestions.length,
            aggregatedQuestions
        });
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error retrieving the questions');
    }
};

const getResultsOfAnsweredQuestionsController = async (req, res) => {
    try {
        const results = await getResultsOfAnsweredQuestions(req.body);
        res.send(results);
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error retrieving the questions');
    }
};
const saveQuestionController = async (req, res) => {
    try {
        await saveQuestion(req.body);
        res.send('ok');
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error saving the questions');
    }
};

module.exports = {
    getAllQuestionsController,
    getQuestionsSplitByAllCategoriesCountController,
    getResultsOfAnsweredQuestionsController,
    saveQuestionController,
    getAllCategoryQuestionsController,
    getCategoryTestController,
    getAllQuestions,
    getQuestionsSplitByAllCategoriesCount
};