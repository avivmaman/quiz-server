const {Category} = require("../../utils/Models");
const mongoose = require("mongoose");
const helper = require("../../utils/helper");

const filterIsActive = (isActiveFilter) => isActiveFilter ? {isActive: true} : {};

const getAllCategoriesBase =  (query ={}, isActiveFilter = true, extra = {}) => {
    const mainFilter = {
        ...query,
        ...filterIsActive(isActiveFilter),
    };

    if(extra.hasOwnProperty('membership') && Array.isArray(extra.membership) && extra.membership.length > 0){
        mainFilter.membership = {
            $in: extra.membership.map(id => new mongoose.Types.ObjectId(id))
        };
    }
    return Category.find(mainFilter);
};

const getAllCategories = async (isActiveFilter = true, extra = {}) => {
    return await getAllCategoriesBase({}, true, extra);
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
        const auth = req.auth;
        const userPackage = helper.getClaimFromAuth0(auth, 'package');
        const categories = await getAllCategories(true, {membership: [userPackage]});
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