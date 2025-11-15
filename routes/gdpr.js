const express = require('express');
const router = express.Router();
const { verifyWebhookHmac } = require('../middleware/verifyWebhook');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const WebhookEvent = require('../models/WebhookEvent');

// Middleware to parse raw body for webhook verification
router.use(express.raw({ type: 'application/json' }));

// POST /api/gdpr/customers/data_request - Customer Data Request
router.post('/customers/data_request', verifyWebhookHmac, async (req, res) => {
  try {
    const shop = req.webhookShop;
    const data = req.body;

    console.log('GDPR: Customer data request received', shop);

    // Log the request
    await WebhookEvent.create(shop, 'customers/data_request', data);

    // This app doesn't store customer data, but you would:
    // 1. Gather any customer data you're storing
    // 2. Send it to the customer (email, API, etc.)
    // 3. You have 48 hours to comply

    res.status(200).json({
      message: 'Customer data request acknowledged'
    });
  } catch (error) {
    console.error('Error processing customer data request:', error);
    res.status(200).json({ message: 'Acknowledged' });
  }
});

// POST /api/gdpr/customers/redact - Customer Data Deletion
router.post('/customers/redact', verifyWebhookHmac, async (req, res) => {
  try {
    const shop = req.webhookShop;
    const data = req.body;

    console.log('GDPR: Customer redact request received', shop);

    // Log the request
    await WebhookEvent.create(shop, 'customers/redact', data);

    // Delete any customer-specific data you're storing
    // This app doesn't store customer data, but if it did:
    // - Delete customer records
    // - Delete associated data
    // You have 48 hours to comply

    res.status(200).json({
      message: 'Customer data redaction acknowledged'
    });
  } catch (error) {
    console.error('Error processing customer redact:', error);
    res.status(200).json({ message: 'Acknowledged' });
  }
});

// POST /api/gdpr/shop/redact - Shop Data Deletion
router.post('/shop/redact', verifyWebhookHmac, async (req, res) => {
  try {
    const shop = req.webhookShop;
    const data = req.body;

    console.log('GDPR: Shop redact request received', shop);

    // Log the request
    await WebhookEvent.create(shop, 'shop/redact', data);

    // Delete all shop data
    // This is triggered 48 hours after app uninstallation
    try {
      // Delete all products for this shop
      await Product.deleteAllForShop(shop);
      console.log(`✓ Deleted all products for ${shop}`);

      // Delete the shop record
      await Shop.delete(shop);
      console.log(`✓ Deleted shop record for ${shop}`);
    } catch (deleteError) {
      console.error('Error deleting shop data:', deleteError);
    }

    res.status(200).json({
      message: 'Shop data redaction acknowledged'
    });
  } catch (error) {
    console.error('Error processing shop redact:', error);
    res.status(200).json({ message: 'Acknowledged' });
  }
});

module.exports = router;

