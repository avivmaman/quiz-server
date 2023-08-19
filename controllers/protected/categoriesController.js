const {Category} = require("../../utils/Models");
const getAllCategories = async () => {
    return await Category.find({});
};

const saveCategory = async (category) => {
    const findCategory = await Category.findById(category._id);
    findCategory.categoryName = category.categoryName;
    findCategory.description = category.description;
    await findCategory.save();
};

const saveCategoryController = async (req, res) => {
    try {
        await saveCategory(req.body);
        res.send('ok');
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error saving the category');
    }
}

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
    saveCategoryController,
    getAllCategories
}