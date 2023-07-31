const {Category} = require("../../utils/Models");
const getAllCategories = async () => {
    return await Category.find({});
};

const getAllCategoriesController = async (req, res) => {
    try{
        const categories = await getAllCategories();
        res.json(categories);
    }catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
};

module.exports = {
    getAllCategoriesController,
    getAllCategories
}