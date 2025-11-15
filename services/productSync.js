/**
 * Product Sync Service
 * Fetches products from Shopify and stores in database
 */

const { queryGraphQL } = require('../utils/shopifyApi');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * Fetch Products from Shopify Admin API
 */
async function fetchProducts(shopDomain) {
  console.log(`Starting product sync for ${shopDomain}...`);

  const results = {
    success: false,
    productsCount: 0,
    errors: []
  };

  try {
    let hasNextPage = true;
    let cursor = null;
    let totalFetched = 0;

    while (hasNextPage) {
      const query = `
        query ($cursor: String) {
          products(first: 50, after: $cursor) {
            edges {
              node {
                id
                title
                handle
                vendor
                productType
                status
                variants(first: 1) {
                  edges {
                    node {
                      price
                      inventoryQuantity
                    }
                  }
                }
                featuredImage {
                  url
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      const variables = cursor ? { cursor } : {};
      const data = await queryGraphQL(shopDomain, query, variables);

      if (!data || !data.products) {
        throw new Error('Invalid response from Shopify API');
      }

      // Process products
      for (const edge of data.products.edges) {
        const product = edge.node;
        const variant = product.variants.edges[0]?.node;

        const productData = {
          shop_domain: shopDomain,
          shopify_product_id: product.id,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor || '',
          product_type: product.productType || '',
          status: product.status.toLowerCase(),
          inventory_quantity: variant?.inventoryQuantity || 0,
          price: parseFloat(variant?.price || 0),
          image_url: product.featuredImage?.url || ''
        };

        await Product.upsert(productData);
        totalFetched++;
      }

      // Check if there are more pages
      hasNextPage = data.products.pageInfo.hasNextPage;

      if (hasNextPage && data.products.edges.length > 0) {
        cursor = data.products.edges[data.products.edges.length - 1].cursor;
      }

      console.log(`Fetched ${totalFetched} products so far...`);
    }

    // Update last sync timestamp
    await Shop.updateLastSync(shopDomain);

    results.success = true;
    results.productsCount = totalFetched;

    console.log(`✓ Product sync complete: ${totalFetched} products`);
  } catch (error) {
    console.error('Error syncing products:', error);
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Fetch Order Analytics from Shopify
 */
async function fetchOrderAnalytics(shopDomain) {
  console.log(`Fetching order analytics for ${shopDomain}...`);

  try {
    const query = `
      query {
        orders(first: 250) {
          edges {
            node {
              id
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
              lineItems(first: 50) {
                edges {
                  node {
                    product {
                      id
                    }
                    quantity
                    originalTotalSet {
                      shopMoney {
                        amount
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await queryGraphQL(shopDomain, query);

    if (!data || !data.orders) {
      return {};
    }

    // Aggregate sales by product
    const analytics = {};

    for (const orderEdge of data.orders.edges) {
      const order = orderEdge.node;

      for (const lineItemEdge of order.lineItems.edges) {
        const lineItem = lineItemEdge.node;
        const productId = lineItem.product?.id;

        if (productId) {
          if (!analytics[productId]) {
            analytics[productId] = {
              revenue: 0,
              unitsSold: 0
            };
          }

          analytics[productId].revenue += parseFloat(lineItem.originalTotalSet.shopMoney.amount);
          analytics[productId].unitsSold += lineItem.quantity;
        }
      }
    }

    console.log(`✓ Order analytics fetched for ${Object.keys(analytics).length} products`);
    return analytics;
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    return {};
  }
}

/**
 * Sync Single Product
 */
async function syncSingleProduct(shopDomain, productId) {
  try {
    const query = `
      query ($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          vendor
          productType
          status
          variants(first: 1) {
            edges {
              node {
                price
                inventoryQuantity
              }
            }
          }
          featuredImage {
            url
          }
        }
      }
    `;

    const data = await queryGraphQL(shopDomain, query, { id: productId });

    if (!data || !data.product) {
      throw new Error('Product not found');
    }

    const product = data.product;
    const variant = product.variants.edges[0]?.node;

    const productData = {
      shop_domain: shopDomain,
      shopify_product_id: product.id,
      title: product.title,
      handle: product.handle,
      vendor: product.vendor || '',
      product_type: product.productType || '',
      status: product.status.toLowerCase(),
      inventory_quantity: variant?.inventoryQuantity || 0,
      price: parseFloat(variant?.price || 0),
      image_url: product.featuredImage?.url || ''
    };

    await Product.upsert(productData);
    console.log(`✓ Product synced: ${product.title}`);

    return productData;
  } catch (error) {
    console.error('Error syncing single product:', error);
    throw error;
  }
}

module.exports = {
  fetchProducts,
  fetchOrderAnalytics,
  syncSingleProduct
};

