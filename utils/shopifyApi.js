/**
 * Shopify Admin API Client
 * Complete implementation with GraphQL, REST, rate limiting
 */

const axios = require('axios');
const Shop = require('../models/Shop');

/**
 * Query Shopify GraphQL Admin API
 */
async function queryGraphQL(shopDomain, query, variables = {}) {
  try {
    const shop = await Shop.findByShop(shopDomain);

    if (!shop || !shop.access_token) {
      throw new Error('Shop not found or missing access token');
    }

    const response = await axios({
      url: `https://${shopDomain}/admin/api/2024-01/graphql.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shop.access_token,
        'Content-Type': 'application/json',
      },
      data: {
        query,
        variables
      }
    });

    // Check for rate limiting
    if (response.headers['x-shopify-shop-api-call-limit']) {
      await handleRateLimit(response.headers);
    }

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('GraphQL query failed: ' + JSON.stringify(response.data.errors));
    }

    return response.data.data;
  } catch (error) {
    console.error('Error querying GraphQL:', error.message);
    throw error;
  }
}

/**
 * Call Shopify REST API
 */
async function callRestAPI(shopDomain, endpoint, method = 'GET', data = null) {
  try {
    const shop = await Shop.findByShop(shopDomain);

    if (!shop || !shop.access_token) {
      throw new Error('Shop not found or missing access token');
    }

    const config = {
      url: `https://${shopDomain}${endpoint}`,
      method,
      headers: {
        'X-Shopify-Access-Token': shop.access_token,
        'Content-Type': 'application/json',
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);

    // Check for rate limiting
    if (response.headers['x-shopify-shop-api-call-limit']) {
      await handleRateLimit(response.headers);
    }

    return response.data;
  } catch (error) {
    console.error('Error calling REST API:', error.message);
    throw error;
  }
}

/**
 * Handle Rate Limiting
 */
async function handleRateLimit(headers) {
  const limitHeader = headers['x-shopify-shop-api-call-limit'];

  if (!limitHeader) return;

  const [current, max] = limitHeader.split('/').map(Number);
  const ratio = current / max;

  // If we're using more than 80% of the limit, add a delay
  if (ratio > 0.8) {
    const delay = Math.floor((ratio - 0.8) * 1000 * 5); // Up to 1 second delay
    console.log(`Rate limit: ${current}/${max}, waiting ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Register Webhook
 */
async function registerWebhook(shopDomain, topic, address) {
  try {
    const data = {
      webhook: {
        topic,
        address,
        format: 'json'
      }
    };

    const result = await callRestAPI(
      shopDomain,
      '/admin/api/2024-01/webhooks.json',
      'POST',
      data
    );

    console.log(`✓ Webhook registered: ${topic} -> ${address}`);
    return result.webhook;
  } catch (error) {
    console.error(`Error registering webhook ${topic}:`, error.message);
    throw error;
  }
}

/**
 * List Webhooks
 */
async function listWebhooks(shopDomain) {
  try {
    const result = await callRestAPI(
      shopDomain,
      '/admin/api/2024-01/webhooks.json',
      'GET'
    );

    return result.webhooks || [];
  } catch (error) {
    console.error('Error listing webhooks:', error.message);
    throw error;
  }
}

/**
 * Delete Webhook
 */
async function deleteWebhook(shopDomain, webhookId) {
  try {
    await callRestAPI(
      shopDomain,
      `/admin/api/2024-01/webhooks/${webhookId}.json`,
      'DELETE'
    );

    console.log(`✓ Webhook deleted: ${webhookId}`);
    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error.message);
    throw error;
  }
}

module.exports = {
  queryGraphQL,
  callRestAPI,
  handleRateLimit,
  registerWebhook,
  listWebhooks,
  deleteWebhook
};

