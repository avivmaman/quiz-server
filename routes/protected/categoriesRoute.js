const {checkJwt, questionLimiter, membershipMiddleware, isAdmin} = require("../../utils/helper");
const {getAllCategoriesController, saveCategoryController} = require("../../controllers/protected/categoriesController");
const setQuestionsRoutes = (app) => {
    app.get('/api/categories', checkJwt, questionLimiter, membershipMiddleware, getAllCategoriesController);

    // Admin Section
    app.get('/api/admin/categories', checkJwt, questionLimiter, isAdmin, membershipMiddleware, getAllCategoriesController);
    app.post('/api/category', checkJwt, questionLimiter, isAdmin, membershipMiddleware, saveCategoryController);
}

module.exports = setQuestionsRoutes;