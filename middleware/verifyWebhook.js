const { verifyWebhookHmac: verifyHmacHelper } = require('../utils/helpers');

function verifyWebhookHmac(req, res, next) {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const shop = req.get('X-Shopify-Shop-Domain');

    if (!hmac) {
      console.error('Missing HMAC header');
      return res.status(401).send('Unauthorized');
    }

    // Get raw body
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    // Verify HMAC
    const isValid = verifyHmacHelper(rawBody, hmac, process.env.SHOPIFY_API_SECRET);

    if (!isValid) {
      console.error('Invalid webhook HMAC');
      return res.status(401).send('Unauthorized');
    }

    // Parse JSON body if still raw
    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString());
    }

    // Attach shop to request
    req.webhookShop = shop;

    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  verifyWebhookHmac
};

