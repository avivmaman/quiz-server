const {checkJwt, questionLimiter} = require("../../utils/helper");
const {getTestByUserIDAndTestIDController, getAllTestByUserIDController} = require("../../controllers/protected/testsController");
const setQuestionsRoutes = (app) => {
    app.get('/api/test/:id', checkJwt, questionLimiter, getTestByUserIDAndTestIDController);
    app.get('/api/tests', checkJwt, questionLimiter, getAllTestByUserIDController);
}

module.exports = setQuestionsRoutes;