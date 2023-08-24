const {Category, UserTests} = require("../../utils/Models");
const helper = require("../../utils/helper");
const getAllTestByUserID = async (userId, selectString = "") => {
    if(selectString !== "") {
        return (await UserTests.find({uid: userId}).select({test: 0, answers: 0}).limit(10).sort({createdAt: -1}));
    }else{
        return (await UserTests.find({uid: userId}).populate({
            path : 'test',
            populate : {
                path : 'category'
            }
        }).limit(10).sort({createdAt: -1}));
    }
};
const getAllTestByUserIDController = async (req, res) => {
    try{
        const auth = req.auth;
        const userId = helper.getClaimFromAuth0(auth, 'id');
        const tests = await getAllTestByUserID(userId, "-test -answers");

        res.json(tests);
    }catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
};

const getTestByUserIDAndTestIDController = async (req, res) => {
    try{
        const auth = req.auth;
        const userId = helper.getClaimFromAuth0(auth, 'id');
        const tests = await getAllTestByUserID(userId);
        res.json(tests.filter(test => test._id.toString() === req.params.id)[0]);
    }catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
};

module.exports = {
    getTestByUserIDAndTestIDController,
    getAllTestByUserIDController
}