const {checkJwt, questionLimiter, membershipMiddleware} = require("../../utils/helper");
const {getAllCategoriesController, saveCategoryController} = require("../../controllers/protected/categoriesController");
const setQuestionsRoutes = (app) => {
    app.get('/api/categories', checkJwt, questionLimiter, membershipMiddleware, getAllCategoriesController);
    app.post('/api/category', checkJwt, questionLimiter, membershipMiddleware, saveCategoryController);
}

module.exports = setQuestionsRoutes;