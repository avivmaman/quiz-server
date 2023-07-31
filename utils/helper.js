const {auth} = require("express-oauth2-jwt-bearer");
const rateLimit = require('express-rate-limit');

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

const questionDao = (question, admin = true) => {
        const imagePath = `https://doa8awg86k4s0.cloudfront.net${question.questionImage}`;
        let returnObject = {
            id: question._id.toString(),
            question : imagePath,
            answerDescription : question.answerDescription,
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
    questionLimiter
};