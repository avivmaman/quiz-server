require('dotenv').config()

const express = require('express');

const helmet = require('helmet');
const cors = require('cors');
const mongoose = require("mongoose");
const { auth } = require('express-oauth2-jwt-bearer');
const bodyParser = require('body-parser');
const connect = require("./utils/connection");
const helper = require("./utils/helper");

// Protected routes
const setQuestionsRoutes = require("./routes/protected/questionsRoute");
const setCategoriesRoutes = require("./routes/protected/categoriesRoute");
const setTestRoutes = require("./routes/protected/testsRoute");
const setMembershipRoutes = require("./routes/protected/membershipRoute");
const setWebhookRoutes = require("./routes/payment/webhook");

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
app.use(helmet());

// Enable CORS
app.use(cors());

// Set Protected Routes
setQuestionsRoutes(app);
setCategoriesRoutes(app);
setTestRoutes(app);
setMembershipRoutes(app);
setWebhookRoutes(app);

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});