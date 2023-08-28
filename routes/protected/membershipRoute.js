const {checkJwt, questionLimiter} = require("../../utils/helper");
const {getAllMembershipsController, getMembershipByIdController} = require("../../controllers/protected/membershipController");
const setQuestionsRoutes = (app) => {
    app.get('/api/admin/membership', checkJwt, questionLimiter, getAllMembershipsController);
    app.get('/api/admin/membership/:id', checkJwt, questionLimiter, getMembershipByIdController);
}

module.exports = setQuestionsRoutes;