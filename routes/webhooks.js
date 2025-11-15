const express = require('express');
const router = express.Router();
const { verifyWebhookHmac } = require('../middleware/verifyWebhook');
const Product = require('../models/Product');
const WebhookEvent = require('../models/WebhookEvent');
const { syncSingleProduct } = require('../services/productSync');

// Middleware to parse raw body for webhook verification
router.use(express.raw({ type: 'application/json' }));

// POST /webhooks/products/create - Product Created Webhook
router.post('/products/create', verifyWebhookHmac, async (req, res) => {
  try {
    const shop = req.webhookShop;
    const product = req.body;

    console.log(`Webhook received: products/create for ${shop}`);

    // Log webhook event
    await WebhookEvent.create(shop, 'products/create', product);

    // Sync the product to database
    if (product.id) {
      try {
        const productId = `gid://shopify/Product/${product.id}`;
        await syncSingleProduct(shop, productId);
        console.log(`✓ Product created: ${product.title}`);
      } catch (syncError) {
        console.error('Error syncing created product:', syncError);
      }
    }

    // Always return 200 OK immediately
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing products/create webhook:', error);
    res.status(200).send('OK'); // Still return 200 to acknowledge receipt
  }
});

// POST /webhooks/products/update - Product Updated Webhook
router.post('/products/update', verifyWebhookHmac, async (req, res) => {
  try {
    const shop = req.webhookShop;
    const product = req.body;

    console.log(`Webhook received: products/update for ${shop}`);

    // Log webhook event
    await WebhookEvent.create(shop, 'products/update', product);

    // Update the product in database
    if (product.id) {
      try {
        const productId = `gid://shopify/Product/${product.id}`;
        await syncSingleProduct(shop, productId);
        console.log(`✓ Product updated: ${product.title}`);
      } catch (syncError) {
        console.error('Error syncing updated product:', syncError);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing products/update webhook:', error);
    res.status(200).send('OK');
  }
});

// POST /webhooks/products/delete - Product Deleted Webhook
router.post('/products/delete', verifyWebhookHmac, async (req, res) => {
  try {
    const shop = req.webhookShop;
    const product = req.body;

    console.log(`Webhook received: products/delete for ${shop}`);

    // Log webhook event
    await WebhookEvent.create(shop, 'products/delete', product);

    // Delete the product from database
    if (product.id) {
      try {
        const productId = `gid://shopify/Product/${product.id}`;
        await Product.deleteByShopifyId(shop, productId);
        console.log(`✓ Product deleted: ${product.title}`);
      } catch (deleteError) {
        console.error('Error deleting product:', deleteError);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing products/delete webhook:', error);
    res.status(200).send('OK');
  }
});

module.exports = router;

