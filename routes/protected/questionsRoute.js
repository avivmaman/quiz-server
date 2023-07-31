const {checkJwt, questionLimiter} = require("../../utils/helper");
const {getAllQuestionsController, getQuestionsSplitByAllCategoriesCountController,
    getResultsOfAnsweredQuestionsController
} = require("../../controllers/protected/questionsController");
const setQuestionsRoutes = (app) => {
    app.get('/api/questions', checkJwt, questionLimiter, getAllQuestionsController);
    app.get('/api/mainQuiz', checkJwt, questionLimiter, getQuestionsSplitByAllCategoriesCountController);

    app.post('/api/mainQuiz', checkJwt, questionLimiter, getResultsOfAnsweredQuestionsController);
}

module.exports = setQuestionsRoutes;