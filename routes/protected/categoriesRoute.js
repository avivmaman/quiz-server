const {checkJwt, questionLimiter} = require("../../utils/helper");
const {getAllCategoriesController} = require("../../controllers/protected/categoriesController");
const setQuestionsRoutes = (app) => {
    app.get('/api/categories', checkJwt, questionLimiter, getAllCategoriesController);
}

module.exports = setQuestionsRoutes;