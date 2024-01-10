require('dotenv').config()

const {auth} = require("express-oauth2-jwt-bearer");
const rateLimit = require('express-rate-limit');
const {Membership} = require("./Models");
const axios = require("axios");
const NodeCache = require("node-cache");

const localCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

const getAccessToken = async () => {
    if(localCache.get("accessToken")) {
        return localCache.get("accessToken");
    }else{
        try{
            const data = {
                client_id: process.env.AUTH0_CLIENT_ID,
                client_secret: process.env.AUTH0_CLIENT_SECRET,
                audience: process.env.AUTH0_AUDIENCE,
                grant_type: "client_credentials"
            };

            const config = {
                headers: {
                    "Content-Type": "application/json"
                }
            };

            const response = await axios.post(process.env.AUTH0_BASE_URL + "/oauth/token", data, config);
            localCache.set("accessToken", response.data.access_token, 890);
            return response.data.access_token;
        }catch (e){
            console.log(e)
            return "";
        }
    }
}

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
            membership: question.membership,
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
    if(claimToGet === 'id') {
        return claims.sub;
    }
    return null;
}

const checkIsAdmin = (auth0) => {
    const allowedRoles = getClaimFromAuth0(auth0, 'x-allowed-roles');
    return !!(allowedRoles && allowedRoles.includes('admin'));
}

const isAdmin = (req, res, next) => {
    const auth = req.auth;
    if(checkIsAdmin(auth)) {
        next();
    }else{
        res.status(403).send({error : "Unauthorized"});
    }
}

const membershipMiddleware = async (req, res, next) => {
    const auth = req.auth;

    // if(checkIsAdmin(auth)) {
    //     next();
    //     return;
    // }

    const userPackage = getClaimFromAuth0(auth, 'package');

    if(userPackage && userPackage !== ''){
        const getPackage = await Membership.findById(userPackage);
        if(getPackage) {
            next();
        }else{
            res.status(403).send({error : "Unauthorized"});
        }
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
    questionLimiter,
    membershipMiddleware,
    getAccessToken,
    localCache,
    checkIsAdmin
};