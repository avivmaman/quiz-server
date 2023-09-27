const {checkJwt, questionLimiter, isAdmin} = require("../../utils/helper");
const {getAllMembershipsController, getMembershipByIdController, saveMembershipController} = require("../../controllers/protected/membershipController");
const setQuestionsRoutes = (app) => {
    app.get('/api/admin/membership', checkJwt, questionLimiter, isAdmin, getAllMembershipsController);
    app.get('/api/admin/membership/:id', checkJwt, questionLimiter, isAdmin, getMembershipByIdController);
    app.post('/api/admin/membership', checkJwt, questionLimiter, isAdmin, saveMembershipController);
}

module.exports = setQuestionsRoutes;