const {checkJwt, questionLimiter, membershipMiddleware} = require("../../utils/helper");
const {getTestByUserIDAndTestIDController, getAllTestByUserIDController} = require("../../controllers/protected/testsController");
const setQuestionsRoutes = (app) => {
    app.get('/api/test/:id', checkJwt, questionLimiter, membershipMiddleware, getTestByUserIDAndTestIDController);
    app.get('/api/tests', checkJwt, questionLimiter, membershipMiddleware, getAllTestByUserIDController);
}

module.exports = setQuestionsRoutes;