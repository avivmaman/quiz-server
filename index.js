require('dotenv').config()

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require("mongoose");
const { auth } = require('express-oauth2-jwt-bearer');
const bodyParser = require('body-parser');
const connect = require("./utils/connection");
const supertokens = require("supertokens-node");
const Session = require("supertokens-node/recipe/session");
const Dashboard = require("supertokens-node/recipe/dashboard");
const UserMetadata = require("supertokens-node/recipe/usermetadata");
const UserRoles = require("supertokens-node/recipe/userroles");
const EmailPassword = require("supertokens-node/recipe/emailpassword");
const {middleware} = require("supertokens-node/framework/express");

supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: "http://3.65.207.28:3567",
    },
    appInfo: {
        // learn more about this on https://supertokens.com/docs/session/appinfo
        appName: "QuizApp",
        apiDomain: process.env.apiDomain,
        websiteDomain: process.env.websiteDomain,
        apiBasePath: "/auth",
        websiteBasePath: "/auth",
    },
    recipeList: [
        EmailPassword.init(),
        Session.init(), // initializes session features
        UserMetadata.init(),
        UserRoles.init(),
        Dashboard.init()
    ]
});

// Protected routes
const setQuestionsRoutes = require("./routes/protected/questionsRoute");
const setCategoriesRoutes = require("./routes/protected/categoriesRoute");
const setUsersRoute = require("./routes/protected/usersRoute");
const {errorHandler} = require("supertokens-node/lib/build/framework/express");

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
    audience: 'uri://quiz.app',
    issuerBaseURL: `https://quiz-app-il.eu.auth0.com/`,
});

// Initialize App
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json({limit: '8000kb'}))

// Apply security headers with Helmet
// app.use(helmet());

app.use(cors({
    origin: process.env.websiteDomain,
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
}));

app.use(middleware());


// Set Protected Routes
setQuestionsRoutes(app);
setCategoriesRoutes(app);
setUsersRoute(app);

app.use(errorHandler())

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});