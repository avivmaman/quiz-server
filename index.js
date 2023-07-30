const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const {listFiles, bucketName, s3, folderPath} = require("./utils/AWSS3");
const db = require('./utils/connection');
const crypto = require('./utils/crypto');
const {decrypt} = require("./utils/crypto");
const {Category, Question} = require("./utils/Models");
const mongoose = require("mongoose");

const app = express();

// Apply security headers with Helmet
app.use(helmet());

// Create a rate limiter for /api/questions route
const questionLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: 5, // Limit each IP to 1 request per 30 seconds
    message: 'Too many requests, please try again later.',
});

// Enable CORS
app.use(cors());

// Define the route to fetch quiz questions with rate limiting
app.get('/api/questions', questionLimiter, async (req, res) => {
    // const category = Category.findOne({ categoryName : "ראשי" });
    const questionsQuery = await Question.find({});
    const questions = questionsQuery.map((image) => {
        const imagePath = `https://doa8awg86k4s0.cloudfront.net${image.questionImage}`;
        return {
            question : imagePath,
            answers : [
                "1",
                "2",
                "3",
                "4"
            ],
            correctAnswers : image.answers
        }
    });

    res.json(questions);
});

// Define the route to fetch quiz questions with rate limiting
app.get('/api/categories', questionLimiter, async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
});

// Define the route to fetch quiz questions with rate limiting
app.get('/api/randomize', questionLimiter, async (req, res) => {
    const categoryIds = ['64b6cece36a40f550ba93f87', '64b6ced336a40f550ba93f89', '64b6ced836a40f550ba93f99', '64b6cede36a40f550ba93fb1', '64b6cee436a40f550ba93fc9', '64b6ceea36a40f550ba93fdd', '64b6cef036a40f550ba94007', '64b6cef636a40f550ba94017', '64b6cefb36a40f550ba9402b', '64b6cf0236a40f550ba94061', '64b6cf0a36a40f550ba9409f', '64b6cf0f36a40f550ba940ad', '64b6cf1436a40f550ba940b5', '64b6cf1a36a40f550ba940d3', '64b6cf2236a40f550ba9411b']
    const totalQuestions = 100;
    const splitSize = Math.ceil(totalQuestions / categoryIds.length);

    try {
        const results = await Question.aggregate([
            {
                $match: {
                    category: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $group: {
                    _id: "$category",
                    questions: { $push: "$$ROOT" }
                }
            }
        ]);
        const aggregatedQuestions = results.reduce((accumulator, category) => {
            // Randomize the questions within each category
            const randomizedQuestions = category.questions.sort(() => Math.random() - 0.5);
            // Split the questions according to the split size
            const splitQuestions = randomizedQuestions.slice(0, splitSize);
            accumulator.push(...splitQuestions);
            return accumulator;
        }, []);

        const remainingQuestions = totalQuestions - aggregatedQuestions.length;
        const remainingCategoryIds = categoryIds.filter(id =>
            !aggregatedQuestions.some(question => question.category.toString() === id)
        );

        // If there are remaining slots and categories available, add more questions
        if (remainingQuestions > 0 && remainingCategoryIds.length > 0) {
            const moreResults = await Question.aggregate([
                {
                    $match: {
                        category: { $in: remainingCategoryIds.map(id => new mongoose.Types.ObjectId(id)) }
                    }
                },
                {
                    $sample: { size: remainingQuestions }
                }
            ]);
            aggregatedQuestions.push(...moreResults);
        }

        if (remainingQuestions > 0) {
            const moreResults = await Question.aggregate([
                {
                    $match: {
                        _id: { $nin: aggregatedQuestions.map((cat) => new mongoose.Types.ObjectId(cat._id)) }
                    }
                },
                {
                    $sample: { size: remainingQuestions }
                }
            ]);
            aggregatedQuestions.push(...moreResults);
        }
        res.send({
            count : aggregatedQuestions.length,
            aggregatedQuestions
        });
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error retrieving the questions');
    }
});

app.get('/api/mainQuiz', questionLimiter, async (req, res) => {
    let categoryIds = await Category.find({});
    categoryIds = categoryIds.map((cat) => cat._id);
    const totalQuestions = 50;
    const splitSize = Math.floor(totalQuestions / categoryIds.length);

    try {
        const results = await Question.aggregate([
            {
                $match: {
                    category: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $group: {
                    _id: "$category",
                    questions: { $push: "$$ROOT" }
                }
            }
        ]);
        const aggregatedQuestions = results.reduce((accumulator, category) => {
            // Randomize the questions within each category
            const randomizedQuestions = category.questions.sort(() => Math.random() - 0.5);
            // Split the questions according to the split size
            const splitQuestions = randomizedQuestions.slice(0, splitSize);
            accumulator.push(...splitQuestions);
            return accumulator;
        }, []);

        const remainingQuestions = totalQuestions - aggregatedQuestions.length;
        const remainingCategoryIds = categoryIds.filter(id =>
            !aggregatedQuestions.some(question => question.category.toString() === id)
        );

        // If there are remaining slots and categories available, add more questions
        if (remainingQuestions > 0) {
            const moreResults = await Question.aggregate([
                {
                    $match: {
                        category: { $in: ["64b6cece36a40f550ba93f87", "64b6ce6236a40f550ba93c7d"].map(id => new mongoose.Types.ObjectId(id))}
                    }
                },
                {
                    $sample: { size: remainingQuestions }
                }
            ]);
            aggregatedQuestions.push(...moreResults);
        }

        res.send({
            count : aggregatedQuestions.length,
            aggregatedQuestions : aggregatedQuestions.map((image) => {
                const imagePath = `https://doa8awg86k4s0.cloudfront.net${image.questionImage}`;
                return {
                    question : imagePath,
                    answers : [
                        "1",
                        "2",
                        "3",
                        "4"
                    ],
                    correctAnswers : image.answers
                }
            })
        });
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error retrieving the questions');
    }
});

// Define other routes
// Endpoint to retrieve and send an image
app.get('/image/:iv/:encryptedData', (req, res) => {
    const imageName = decrypt({
        iv: req.params.iv,
        encryptedData: req.params.encryptedData
    });

    const params = {
        Bucket: bucketName,
        Key: `${folderPath}/${imageName}` // The name of the image file in S3
    };

    s3.getObject(params, (err, data) => {
        if (err) {
            console.log('Error', err);
            res.status(500).send('Error retrieving the image');
        } else {
            res.set('Content-Type', data.ContentType);
            res.send(data.Body);
        }
    });
});

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});