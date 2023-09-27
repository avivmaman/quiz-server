const {Membership, Category} = require("../../utils/Models");
const helper = require("../../utils/helper");
const getAllMemberships = async (findObject = {}) => {
    return (await Membership.find(findObject));
};

const getMembershipById = async (id) => {
    return (await getAllMemberships({_id: id}));
};

const getAllMembershipsController = async (req, res) => {
    try{
        const memberships = await getAllMemberships();
        res.json(memberships);
    }catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
}

const getMembershipByIdController = async (req, res) => {
    try{
        const memberships = await getMembershipById(req.params.id);
        res.json(memberships);
    }catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
}

const saveMembership = async (membership) => {
    const findMembership = await getMembershipById(membership._id);
    if(membership.hasOwnProperty("title")) {
        findMembership.title = membership.title;
    }
    await findMembership.save();
};

const saveMembershipController = async (req, res) => {
    try {
        await saveMembership(req.body);
        res.send('ok');
    }catch (e) {
        console.log('Error', e);
        res.status(500).send('Error saving the membership');
    }
}

module.exports = {
    getAllMembershipsController,
    saveMembershipController,
    getMembershipByIdController
}