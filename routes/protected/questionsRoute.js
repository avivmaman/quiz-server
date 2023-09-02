const {checkJwt, questionLimiter, isAdmin, membershipMiddleware} = require("../../utils/helper");
const {getAllQuestionsController, getQuestionsSplitByAllCategoriesCountController,
    getResultsOfAnsweredQuestionsController, saveQuestionController, getCategoryTestController,
    getAllCategoryQuestionsController, getQuestionNumberController, getQuestionNumberAndCategoryController,
    addQuestionController, getQuestionHighestNumberController
} = require("../../controllers/protected/questionsController");
const setQuestionsRoutes = (app) => {
    app.get('/api/questions', checkJwt, questionLimiter, membershipMiddleware, getAllQuestionsController);

    app.get('/api/mainQuiz', checkJwt, questionLimiter, membershipMiddleware, getQuestionsSplitByAllCategoriesCountController);

    app.get('/api/questions/:category', checkJwt, questionLimiter, membershipMiddleware, getAllCategoryQuestionsController);

    app.get('/api/questions/:category/test', checkJwt, questionLimiter, membershipMiddleware, getCategoryTestController);
    app.post('/api/mainQuiz/:testType', checkJwt, questionLimiter, membershipMiddleware, getResultsOfAnsweredQuestionsController);


    // Admin Section
    app.get('/api/admin/questions/highest', checkJwt, questionLimiter, isAdmin, getQuestionHighestNumberController);
    app.get('/api/questions/byIndex/:number', checkJwt, questionLimiter, isAdmin, getQuestionNumberController);
    app.get('/api/questions/byIndex/:number/:category', checkJwt, questionLimiter, isAdmin, getQuestionNumberAndCategoryController);

    app.post('/api/saveQna', checkJwt, questionLimiter, isAdmin, saveQuestionController);
    app.post('/api/addQna', checkJwt, questionLimiter, isAdmin, addQuestionController);
}

module.exports = setQuestionsRoutes;