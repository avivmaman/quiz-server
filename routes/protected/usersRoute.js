const {addClaims, questionLimiter} = require("../../utils/helper");
const { verifySession } = require("supertokens-node/recipe/session/framework/express");
const setUsersRoutes = (app) => {
    app.get('/api/user', verifySession(), addClaims, questionLimiter, async (req, res) => {
        res.send({
            success : true,
        });
    });
}

module.exports = setUsersRoutes;