const {getWebhookController} = require("../../controllers/payment/webhookController");

const setPaymentWebhook = (app) => {
    app.get('/api/webhook/:user/:packageId', getWebhookController);
}

module.exports = setPaymentWebhook;