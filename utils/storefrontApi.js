/**
 * Shopify Storefront API Client
 * For accessing public product data
 */

const axios = require('axios');

/**
 * Query Storefront API
 */
async function queryStorefront(shopDomain, query, variables = {}) {
  try {
    if (!process.env.STOREFRONT_ACCESS_TOKEN) {
      throw new Error('STOREFRONT_ACCESS_TOKEN not configured');
    }

    const response = await axios({
      url: `https://${shopDomain}/api/2024-01/graphql.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': process.env.STOREFRONT_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      data: {
        query,
        variables
      }
    });

    if (response.data.errors) {
      console.error('Storefront GraphQL errors:', response.data.errors);
      throw new Error('Storefront query failed');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error querying Storefront API:', error.message);
    throw error;
  }
}

/**
 * Fetch Public Products
 */
async function fetchPublicProducts(shopDomain) {
  const query = `
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            availableForSale
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    const data = await queryStorefront(shopDomain, query);
    return data.products.edges.map(edge => edge.node);
  } catch (error) {
    console.error('Error fetching public products:', error.message);
    return [];
  }
}

module.exports = {
  queryStorefront,
  fetchPublicProducts
};

