require('dotenv').config()

const {getAccessToken} = require("../../utils/helper");
const axios = require("axios");
const getWebhookController = async (req, res) => {
    try{
        res.status(200).send({success : true});
        return;
        // TODO : Validate payment provider integrity by checking the signature
        // TODO : Validate by payment provider that the payment was successful
        const user = req.params.user;
        const packageId = req.params.packageId;
        if(user){
            const accessToken = await getAccessToken();
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `${process.env.AUTH0_BASE_URL}/api/v2/users?q=email%3A%22${user.replace("@", "%40")}%22`,
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                }
             };
            const response = await axios(config);
            if(response.data.length > 0) {
                const user = response.data[0];
                const userMetadata = user.user_metadata;
                userMetadata.package = packageId;
                let config = {
                    method: 'patch',
                    maxBodyLength: Infinity,
                    url: `${process.env.AUTH0_BASE_URL}/api/v2/users/${user.user_id}`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + accessToken
                    },
                    data : {
                        user_metadata: userMetadata
                    }
                };
                const saveUserResponse = await axios(config);

                // TODO : Send user to main page after successful payment
                res.status(200).send({success : true});
            }
        }
    }catch (e) {
        console.log(e);
        res.status(500).send({error : "Something went wrong"});
    }
}

module.exports = {
    getWebhookController
};