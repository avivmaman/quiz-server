const {checkJwt, questionLimiter} = require("../../utils/helper");
const {getAllCategoriesController, saveCategoryController} = require("../../controllers/protected/categoriesController");
const setQuestionsRoutes = (app) => {
    app.get('/api/categories', checkJwt, questionLimiter, getAllCategoriesController);
    app.post('/api/category', checkJwt, questionLimiter, saveCategoryController);
}

module.exports = setQuestionsRoutes;