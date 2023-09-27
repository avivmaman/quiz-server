const {Question, Category, UserTests} = require("../../utils/Models");
const helper = require("../../utils/helper");
const mongoose = require("mongoose");

const filterIsActive = (isActiveFilter) => isActiveFilter ? {isActive: true} : {};

const getAllQuestionsBase = (query = {}, isActiveFilter = true, extra = {}) => {
    const mainFilter = {
        ...query,
        ...filterIsActive(isActiveFilter),
    };

    if(extra.hasOwnProperty('membership') && Array.isArray(extra.membership) && extra.membership.length > 0){
        mainFilter.membership = {
            $in: extra.membership.map(id => new mongoose.Types.ObjectId(id))
        };
    }
    return Question.find(mainFilter);
};

const getAllQuestionsCountBase = (query = {}, isActiveFilter = true, extra = {}) => {
    const mainFilter = {
        ...query,
        ...filterIsActive(isActiveFilter),
    };

    if(extra.hasOwnProperty('membership') && Array.isArray(extra.membership) && extra.membership.length > 0){
        mainFilter.membership = {
            $in: extra.membership.map(id => new mongoose.Types.ObjectId(id))
        };
    }
    return Question.countDocuments(mainFilter);
};

const getAllQuestions = async (isActiveFilter = true, extra = {}) => {
    return (await getAllQuestionsBase({}, isActiveFilter, extra).sort({
        category: 1,
        questionNumber: 1
    }).populate('category membership'));
};

const countAllQuestions = async (isActiveFilter = true, extra = {}) => {
    return (await getAllQuestionsCountBase({}, isActiveFilter, extra));
};

const getAllQuestionsByLimit = async (skip, limit = 1, isActiveFilter = true, extra = {}) => {
    const questionsQuery = await getAllQuestionsBase({}, isActiveFilter, extra).sort({category: 1, questionNumber: 1}).populate('category membership').skip(skip).limit(limit);
    return helper.questionsDao(questionsQuery);
};

const getAllQuestionsByLimitAndCategory = async (categoryId, skip, limit = 1, isActiveFilter = true, extra = {}) => {
    const questionsQuery = await getAllQuestionsBase({category: new mongoose.Types.ObjectId(categoryId) }, isActiveFilter, extra).sort({questionNumber: 1}).populate('category membership').skip(skip).limit(limit);
    return helper.questionsDao(questionsQuery);
};

const getQuestionByObject = async (objectToFind, isActiveFilter = true, extra) => {
    const questionsQuery = await getAllQuestionsBase({...objectToFind}, isActiveFilter, extra).populate('category membership');
    return helper.questionDao(questionsQuery);
};

const getQuestionsByObject = async (objectToFind,isCount = false, isActiveFilter = true, extra = {}) => {
    console.log('objectToFind', objectToFind, isActiveFilter, extra);
    if(isCount){
        return (await getAllQuestionsCountBase({...objectToFind}, isActiveFilter, extra));
    }else {
        const questionsQuery = await getAllQuestionsBase({...objectToFind}, isActiveFilter, extra).populate('category membership');
        return helper.questionsDao(questionsQuery);
    }
};


const getAllCategoryQuestions = async (category, isActiveFilter = true, extra = {}) => {
    const questionsQuery = await getAllQuestionsBase({ category }, isActiveFilter, extra).populate('category membership');
    const randomizedQuestions = questionsQuery.sort(() => Math.random() - 0.5);
    return helper.questionsDao(randomizedQuestions);
};

const getCategoryTest = async (category, isActiveFilter = true, extra = {}) => {
    const questionsQuery = await getAllCategoryQuestions(category, true, extra);
    if(questionsQuery.length < 20){
        return questionsQuery;
    }else{
        const randomizedQuestions = questionsQuery.sort(() => Math.random() - 0.5);
        return randomizedQuestions.slice(0, 20);
    }
};

const getQuestionsSplitByAllCategoriesCount = async (limit, isActiveFilter = true, extra = {}) => {
    const mainFilter = {
        ...filterIsActive(isActiveFilter),
    };

    if(extra.hasOwnProperty('membership') && Array.isArray(extra.membership) && extra.membership.length > 0){
        mainFilter.membership = {
            $in: extra.membership.map(id => new mongoose.Types.ObjectId(id))
        };
    }

    const numQuestionsToRetrieve = 50;
    const categories = await Category.find(mainFilter);
    const questionPerCategory = Math.floor(numQuestionsToRetrieve / categories.length);
    let remainingQuestions = numQuestionsToRetrieve - (questionPerCategory * categories.length);

    // Combine questions from each category with random questions
    const finalQuestions = [];
    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const questions = await Question.find({ ...mainFilter, category: category._id }).limit(questionPerCategory).populate('category membership');
        if(questions.length < questionPerCategory){
            remainingQuestions = remainingQuestions + (questionPerCategory - questions.length);
        }
        finalQuestions.push(...questions);
    }
    // Step 4: Retrieve random questions from all categories
    let randomQuestions = await Question.aggregate([
        { $match: mainFilter },
        {
            $match: {
                _id: { $nin: finalQuestions.map(question => new mongoose.Types.ObjectId(question._id)) }
            }
        },
        { $sample: { size: remainingQuestions } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } }
    ]);
    randomQuestions = randomQuestions.map(question => {
        return {
            ...question,
            category: question.category[0]
        };
    });

    finalQuestions.push(...randomQuestions);
    return helper.questionsDao(finalQuestions);
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
    newQuestion.membership = question.membership;
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
    newQuestion.membership = question.membership;
    await newQuestion.save();
}
const getAllQuestionsController = async (req, res) => {
    try{
        const allQuestions = await getAllQuestions();
        res.json(helper.questionsDao(allQuestions));
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

// Admin Routes
const getQuestionNumberController = async (req, res) => {
    try{
        const auth = req.auth;
        const userPackage = helper.getClaimFromAuth0(auth, 'package');
        let count = await countAllQuestions(false, false, {membership: [userPackage]});
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
        const auth = req.auth;
        const userPackage = helper.getClaimFromAuth0(auth, 'package');
        const allQuestions = await getAllCategoryQuestions(req.params.category, true, {membership: [userPackage]});
        res.json(allQuestions);
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getCategoryTestController = async (req, res) => {
    try{
        const auth = req.auth;
        const userPackage = helper.getClaimFromAuth0(auth, 'package');
        const allQuestions = await getCategoryTest(req.params.category, true, {membership: [userPackage]});
        res.json(allQuestions);
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getQuestionsSplitByAllCategoriesCountController = async (req, res) => {
    try {
        const auth = req.auth;
        const userPackage = helper.getClaimFromAuth0(auth, 'package');
        const aggregatedQuestions = await getQuestionsSplitByAllCategoriesCount(50, true, {membership: [userPackage]});
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