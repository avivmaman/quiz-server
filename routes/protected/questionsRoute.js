const {checkJwt, questionLimiter, validateAdmin} = require("../../utils/helper");
const {getAllQuestionsController, getQuestionsSplitByAllCategoriesCountController,
    getResultsOfAnsweredQuestionsController, saveQuestionController, getCategoryTestController,
    getAllCategoryQuestionsController, getQuestionNumberController
} = require("../../controllers/protected/questionsController");
const { verifySession } = require("supertokens-node/recipe/session/framework/express");
const setQuestionsRoutes = (app) => {
    app.get('/api/questions', verifySession(), validateAdmin, questionLimiter, getAllQuestionsController);
    app.get('/api/questions/byIndex/:number', verifySession(), validateAdmin, questionLimiter, getQuestionNumberController);
    app.get('/api/mainQuiz', verifySession(), questionLimiter, getQuestionsSplitByAllCategoriesCountController);

    app.get('/api/questions/:category', verifySession(), questionLimiter, getAllCategoryQuestionsController);
    app.get('/api/questions/:category/test', verifySession(), questionLimiter, getCategoryTestController);

    app.post('/api/mainQuiz', verifySession(), questionLimiter, getResultsOfAnsweredQuestionsController);

    app.post('/api/saveQna', verifySession(), validateAdmin, questionLimiter, saveQuestionController);
}

module.exports = setQuestionsRoutes;