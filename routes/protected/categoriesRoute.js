const {checkJwt, questionLimiter} = require("../../utils/helper");
const {getAllCategoriesController, saveCategoryController} = require("../../controllers/protected/categoriesController");
const { verifySession } = require("supertokens-node/recipe/session/framework/express");
const setQuestionsRoutes = (app) => {
    app.get('/api/categories', verifySession(), questionLimiter, getAllCategoriesController);
    app.post('/api/category', verifySession(), questionLimiter, saveCategoryController);
}

module.exports = setQuestionsRoutes;