const {checkJwt, questionLimiter} = require("../../utils/helper");
const {getAllQuestionsController, getQuestionsSplitByAllCategoriesCountController,
    getResultsOfAnsweredQuestionsController, saveQuestionController, getCategoryTestController,
    getAllCategoryQuestionsController
} = require("../../controllers/protected/questionsController");
const setQuestionsRoutes = (app) => {
    app.get('/api/questions', checkJwt, questionLimiter, getAllQuestionsController);
    app.get('/api/mainQuiz', checkJwt, questionLimiter, getQuestionsSplitByAllCategoriesCountController);

    app.get('/api/questions/:category', checkJwt, questionLimiter, getAllCategoryQuestionsController);
    app.get('/api/questions/:category/test', checkJwt, questionLimiter, getCategoryTestController);

    app.post('/api/mainQuiz', checkJwt, questionLimiter, getResultsOfAnsweredQuestionsController);

    app.post('/api/saveQna', checkJwt, questionLimiter, saveQuestionController);
}

module.exports = setQuestionsRoutes;