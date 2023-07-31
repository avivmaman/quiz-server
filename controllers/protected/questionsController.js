const {Question, Category} = require("../../utils/Models");
const helper = require("../../utils/helper");
const mongoose = require("mongoose");
const getAllQuestions = async () => {
    const questionsQuery = await Question.find({});
    return helper.questionsDao(questionsQuery);
};

const getQuestionsSplitByAllCategoriesCount = async (limit) => {
    let categoryIds = await Category.find({});
    categoryIds = categoryIds.map((cat) => cat._id);
    const totalQuestions = limit;
    const splitSize = Math.floor(totalQuestions / categoryIds.length);

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
    return helper.questionsDao(aggregatedQuestions);
}

const getResultsOfAnsweredQuestions = async (results) => {
    const questions = await Question.find({ _id: { $in: results.map(result => result.id) } });
    return questions.map((question, index) => {
        const resultQuestion = results.find(i => i.id === question._id.toString());
        const isCorrect = question.answers.every((answer) => {
            return resultQuestion.answers.includes(answer - 1);
        });
        let correctAnswer;
        let notCorrectAnswer;
        if(!isCorrect) {
            correctAnswer = question.answers.filter((answer) => !resultQuestion.answers.includes(answer - 1));
            notCorrectAnswer = question.answers.filter((answer) => resultQuestion.answers.includes(answer - 1));
        }
        return {
            question: helper.questionDao(question),
            isCorrect,
            correctAnswer,
            notCorrectAnswer,
        }
    });
}
const getAllQuestionsController = async (req, res) => {
    try{
        const allQuestions = await getAllQuestions();
        res.json(allQuestions);
    }catch (e) {
        console.log('Error', e);
        res.status(403).send({error : "Cant get all questions, try again later"});
    }

};

const getQuestionsSplitByAllCategoriesCountController = async (req, res) => {
    try {
        const aggregatedQuestions = await getQuestionsSplitByAllCategoriesCount(10);
        res.send({
            count : aggregatedQuestions.length,
            aggregatedQuestions
        });
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error retrieving the questions');
    }
};

const getResultsOfAnsweredQuestionsController = async (req, res) => {
    try {
        const results = await getResultsOfAnsweredQuestions(req.body);
        res.send(results);
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error retrieving the questions');
    }
};

module.exports = {
    getAllQuestionsController,
    getQuestionsSplitByAllCategoriesCountController,
    getResultsOfAnsweredQuestionsController,
    getAllQuestions,
    getQuestionsSplitByAllCategoriesCount
};