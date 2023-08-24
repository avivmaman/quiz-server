const {checkJwt, questionLimiter, isAdmin} = require("../../utils/helper");
const {getAllQuestionsController, getQuestionsSplitByAllCategoriesCountController,
    getResultsOfAnsweredQuestionsController, saveQuestionController, getCategoryTestController,
    getAllCategoryQuestionsController, getQuestionNumberController
} = require("../../controllers/protected/questionsController");
const setQuestionsRoutes = (app) => {
    app.get('/api/questions', checkJwt, questionLimiter, getAllQuestionsController);

    app.get('/api/mainQuiz', checkJwt, questionLimiter, getQuestionsSplitByAllCategoriesCountController);

    app.get('/api/questions/:category', checkJwt, questionLimiter, getAllCategoryQuestionsController);

    app.get('/api/questions/:category/test', checkJwt, questionLimiter, getCategoryTestController);
    app.post('/api/mainQuiz/:testType', checkJwt, questionLimiter, getResultsOfAnsweredQuestionsController);


    // Admin Section
    app.get('/api/questions/byIndex/:number', checkJwt, questionLimiter, isAdmin, getQuestionNumberController);
    app.post('/api/saveQna', checkJwt, questionLimiter, isAdmin, saveQuestionController);
}

module.exports = setQuestionsRoutes;