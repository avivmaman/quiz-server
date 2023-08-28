const {Question, Category, UserTests} = require("../../utils/Models");
const helper = require("../../utils/helper");
const mongoose = require("mongoose");
const {Mongoose} = require("mongoose");

const filterIsActive = (isActiveFilter) => isActiveFilter ? {isActive: true} : {};

const getAllQuestions = async (isActiveFilter = true) => {
    const questionsQuery = await Question.find(filterIsActive(isActiveFilter)).sort({category: 1, questionNumber: 1}).populate('category');
    return helper.questionsDao(questionsQuery);
};

const countAllQuestions = async (isActiveFilter = true) => {
    const questionsQuery = await Question.countDocuments(filterIsActive(isActiveFilter));
    return questionsQuery;
};

const getAllQuestionsByLimit = async (skip, limit = 1, isActiveFilter = true) => {
    const questionsQuery = await Question.find(filterIsActive(isActiveFilter)).sort({category: 1, questionNumber: 1}).populate('category').skip(skip).limit(limit);
    return helper.questionsDao(questionsQuery);
};

const getAllQuestionsByLimitAndCategory = async (categoryId, skip, limit = 1, isActiveFilter = true) => {
    const questionsQuery = await Question.find({...filterIsActive(isActiveFilter), category: new mongoose.Types.ObjectId(categoryId) }).sort({questionNumber: 1}).populate('category').skip(skip).limit(limit);
    return helper.questionsDao(questionsQuery);
};

const getQuestionByObject = async (objectToFind, isActiveFilter = true) => {
    const questionsQuery = await Question.findOne({...objectToFind, ...filterIsActive(isActiveFilter)}).populate('category');
    return helper.questionDao(questionsQuery);
};

const getQuestionsByObject = async (objectToFind,isCount = false, isActiveFilter = true) => {
    if(isCount){
        return (await Question.countDocuments({...objectToFind, ...filterIsActive(isActiveFilter)}));
    }else {
        const questionsQuery = await Question.find({...objectToFind, ...filterIsActive(isActiveFilter)}).populate('category');
        return helper.questionsDao(questionsQuery);
    }
};


const getAllCategoryQuestions = async (category, isActiveFilter = true) => {
    const questionsQuery = await Question.find({ category, ...filterIsActive(isActiveFilter) }).populate('category');
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

const getQuestionsSplitByAllCategoriesCount = async (limit, isActiveFilter = true) => {
    let categoryIds = await Category.find({});
    categoryIds = categoryIds.map((cat) => cat._id);
    const totalQuestions = limit;
    const splitSize = Math.floor(totalQuestions / categoryIds.length);

    let results ;
    if(isActiveFilter){
        results = await Question.aggregate([
            {
                $match: {
                    category: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) },
                },
            },
            {
                $match: {
                    isActive: true
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
    }else{
        results = await Question.aggregate([
            {
                $match: {
                    category: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) },
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
    }
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
        if(isActiveFilter){
            const moreResults = await Question.aggregate([
                {
                    $match: {
                        category: { $in: ["64b6cece36a40f550ba93f87", "64b6ce6236a40f550ba93c7d"].map(id => new mongoose.Types.ObjectId(id))},
                        isActive: true
                    }
                },
                {
                    $sample: { size: remainingQuestions }
                },
                { $lookup: {from: 'categories', localField: 'category', foreignField: '_id', as: 'category'} },
            ]);
            aggregatedQuestions.push(...moreResults);
        }else{
            const moreResults = await Question.aggregate([
                {
                    $match: {
                        category: { $in: ["64b6cece36a40f550ba93f87", "64b6ce6236a40f550ba93c7d"].map(id => new mongoose.Types.ObjectId(id))},
                    }
                },
                {
                    $sample: { size: remainingQuestions }
                },
                { $lookup: {from: 'categories', localField: 'category', foreignField: '_id', as: 'category'} },
            ]);
            aggregatedQuestions.push(...moreResults);
        }

    }
    return helper.questionsDao(aggregatedQuestions);
}

const getResultsIDOfAnsweredQuestions = async (results, userId, testType) => {
    const resultsIds = results.map(result => result.id);
    const questions = await Question.find({ _id: { $in: resultsIds } });

    let resultsByIds = [];
    let correctAnswer = 0;
    let notCorrectAnswer = 0;

    questions.map((question, index) => {
        const resultQuestion = results.find(i => i.id === question._id.toString());
        const correctResult = resultQuestion.answers[0];
        const questionResult = question.answers[0];

        if(correctResult === questionResult){
            correctAnswer++;
        } else {
            notCorrectAnswer++;
        }

        resultsByIds.push({
            qid: question._id.toString(),
            results: [...resultQuestion.answers].pop()
        });
    });
    const score = ((correctAnswer / (correctAnswer + notCorrectAnswer)).toFixed(2) * 100).toFixed(2);
    return await saveUserTest(resultsIds, resultsByIds, score, userId, testType);
}

const saveUserTest = async (questionsIds, answers, score, userId, testType) => {
    const newUserTest = new UserTests({
        uid: userId,
        testType,
        score,
        test: questionsIds,
        answers
    });
    await newUserTest.save();
    return newUserTest._id;
}

// Admin Routes
const saveQuestion = async (question) => {
    const newQuestion = await Question.findById(question.id);
    newQuestion.answers = question.answers;
    newQuestion.answerDescription = question.answerDescription;
    newQuestion.questionDescription = question.questionDescription;
    newQuestion.isActive = question.isActive;
    await newQuestion.save();
}

const addQuestion = async (question) => {
    const newQuestion = new Question();
    newQuestion.answers = question.answers;
    newQuestion.answerDescription = question.answerDescription;
    newQuestion.questionDescription = question.questionDescription;
    newQuestion.isActive = question.isActive;
    newQuestion.category = question.category;
    newQuestion.questionNumber = question.questionNumber;

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

// Admin Routes
const getQuestionNumberController = async (req, res) => {
    try{
        let count = await countAllQuestions(false);
        const question = (await getAllQuestionsByLimit(req.params.number - 1, 1, false))[0];
        res.json({question, count});
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getQuestionNumberAndCategoryController = async (req, res) => {
    try{
        let count = await getQuestionsByObject({
            category: new mongoose.Types.ObjectId(req.params.category)
        }, true, false);

        const question = (await getAllQuestionsByLimitAndCategory(req.params.category,req.params.number - 1, 1, false))[0];
        res.json({question, count});
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getQuestionHighestNumberController = async (req, res) => {
    try{
        let num = await Question.findOne().sort({questionNumber: -1});

        res.json({count : num.questionNumber});
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
        const auth = req.auth;
        const userId = helper.getClaimFromAuth0(auth, 'id');
        const resultsId = await getResultsIDOfAnsweredQuestions(req.body, userId, req.params.testType);
        res.send({
            resultsId
        });
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

const addQuestionController = async (req, res) => {
    try {
        await addQuestion(req.body);
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
    addQuestionController,
    getAllCategoryQuestionsController,
    getCategoryTestController,
    getQuestionNumberController,
    getQuestionNumberAndCategoryController,
    getQuestionHighestNumberController,
    getAllQuestions,
    getQuestionsSplitByAllCategoriesCount
};