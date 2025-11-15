/**
 * Webhook Registration Script
 * Run with: node scripts/registerWebhooks.js <shop-domain>
 */

require('dotenv').config();
const { registerWebhook, listWebhooks, deleteWebhook } = require('../utils/shopifyApi');

const WEBHOOKS = [
  {
    topic: 'products/create',
    endpoint: '/webhooks/products/create'
  },
  {
    topic: 'products/update',
    endpoint: '/webhooks/products/update'
  },
  {
    topic: 'products/delete',
    endpoint: '/webhooks/products/delete'
  },
  {
    topic: 'customers/data_request',
    endpoint: '/api/gdpr/customers/data_request'
  },
  {
    topic: 'customers/redact',
    endpoint: '/api/gdpr/customers/redact'
  },
  {
    topic: 'shop/redact',
    endpoint: '/api/gdpr/shop/redact'
  }
];

async function registerAllWebhooks() {
  console.log('========================================');
  console.log('Webhook Registration');
  console.log('========================================\n');

  const shopDomain = process.argv[2];

  if (!shopDomain) {
    console.error('❌ Please provide shop domain as argument');
    console.error('Usage: node scripts/registerWebhooks.js mystore.myshopify.com');
    process.exit(1);
  }

  if (!process.env.HOST) {
    console.error('❌ HOST not configured in .env');
    process.exit(1);
  }

  console.log(`Shop: ${shopDomain}`);
  console.log(`Host: ${process.env.HOST}\n`);

  try {
    // First, list existing webhooks
    console.log('Fetching existing webhooks...');
    const existing = await listWebhooks(shopDomain);
    console.log(`Found ${existing.length} existing webhooks\n`);

    // Register each webhook
    console.log('Registering webhooks...\n');

    for (const webhook of WEBHOOKS) {
      const address = `${process.env.HOST}${webhook.endpoint}`;

      console.log(`📝 ${webhook.topic}`);
      console.log(`   URL: ${address}`);

      try {
        // Check if already exists
        const existingWebhook = existing.find(w => w.topic === webhook.topic);

        if (existingWebhook) {
          console.log(`   ℹ Already registered (ID: ${existingWebhook.id})`);

          // Delete and re-register if URL changed
          if (existingWebhook.address !== address) {
            console.log(`   Updating webhook...`);
            await deleteWebhook(shopDomain, existingWebhook.id);
            const result = await registerWebhook(shopDomain, webhook.topic, address);
            console.log(`   ✓ Updated (New ID: ${result.id})`);
          }
        } else {
          const result = await registerWebhook(shopDomain, webhook.topic, address);
          console.log(`   ✓ Registered (ID: ${result.id})`);
        }
      } catch (error) {
        console.error(`   ✗ Failed: ${error.message}`);
      }

      console.log('');
    }

    console.log('========================================');
    console.log('Webhook Registration Complete!');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('Webhook Registration Failed!');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure shop is installed and has valid token');
    console.error('  2. Check HOST in .env points to accessible URL');
    console.error('  3. Verify ngrok is running for development');
    console.error('  4. Check Shopify API credentials');
    process.exit(1);
  }
}

registerAllWebhooks();

