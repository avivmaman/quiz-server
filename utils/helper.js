const {auth} = require("express-oauth2-jwt-bearer");
const rateLimit = require('express-rate-limit');
const UserMetadata = require("supertokens-node/recipe/usermetadata");
const EmailPassword = require("supertokens-node/recipe/emailpassword");

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
    audience: 'uri://quiz.app',
    issuerBaseURL: `https://quiz-app-il.eu.auth0.com/`,
});

// Create a rate limiter for /api/questions route
const questionLimiter = rateLimit({
    windowMs: 60 * 1000, // 30 seconds
    max: 20, // Limit each IP to 1 request per 30 seconds
    message: 'Too many requests, please try again later.',
});

const addClaims = async (req, res, next) => {
    const session = req.session;
    const userId = session.getUserId();

    const { metadata } = await UserMetadata.getUserMetadata(userId);
    const isAdmin = metadata.hasOwnProperty("isAdmin") ? metadata.isAdmin : false;
    let userInfo = await EmailPassword.getUserById(userId);

    await session.mergeIntoAccessTokenPayload(
        { isAdmin, userInfo }
    );

    next();
}

const validateAdmin = async (req, res, next) => {
    const session = req.session;
    const userId = session.getUserId();

    const { metadata } = await UserMetadata.getUserMetadata(userId);
    if(metadata.isAdmin) {
        next();
    } else {
        res.status(401).send("Unauthorized");
    }
}

const questionDao = (question, admin = true) => {
        if(Array.isArray(question.category) &&  question.category.length > 0) {
            question.category = question.category[0];
        }
        const imagePath = `https://doa8awg86k4s0.cloudfront.net${question.questionImage}`;
        let returnObject = {
            id: question._id.toString(),
            questionNumber : question.questionNumber,
            questionDescription : question.questionDescription,
            question : imagePath,
            answerDescription : question.answerDescription,
            category : question.category.categoryName,
        };
        if(admin) {
            returnObject.answers = question.answers;
        }
        return returnObject;
}
const questionsDao = (questions) => {
    return questions.map((image) => questionDao(image));
}

module.exports = {
    questionDao,
    questionsDao,
    checkJwt,
    questionLimiter,
    validateAdmin,
    addClaims
};