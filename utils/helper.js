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
            isActive: question.isActive,
        };
        if(admin) {
            returnObject.answers = question.answers;
        }
        return returnObject;
}
const questionsDao = (questions) => {
    return questions.map((image) => questionDao(image));
}

const getClaimFromAuth0= (auth0, claimToGet, fromSubClaims = true) => {
    const claims = auth0.payload;
    if(fromSubClaims){
        const uri = "uri://quiz.app/jwt/claims";
        if(claims.hasOwnProperty(uri) && claims[uri].hasOwnProperty(claimToGet)) {
            return claims[uri][claimToGet];
        }
    }
    if(claims.hasOwnProperty(claimToGet)) {
        return claims[claimToGet];
    }
    return null;
}

const isAdmin = (req, res, next) => {
    const auth = req.auth;
    const allowedRoles = getClaimFromAuth0(auth, 'x-allowed-roles');
    if(allowedRoles.includes('admin')) {
        next();
    }else{
        res.status(403).send({error : "Unauthorized"});
    }
}

module.exports = {
    questionDao,
    questionsDao,
    getClaimFromAuth0,
    isAdmin,
    checkJwt,
    questionLimiter
};