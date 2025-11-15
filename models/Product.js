const { query } = require('../config/database');

const Product = {
  async findAll(shopDomain, options = {}) {
    try {
      const { limit = 100, offset = 0, orderBy = 'title', order = 'ASC', search = '' } = options;

      let queryText = 'SELECT * FROM products_snapshot WHERE shop_domain = $1';
      const params = [shopDomain];

      if (search) {
        queryText += ' AND (title ILIKE $' + (params.length + 1) + ' OR handle ILIKE $' + (params.length + 1) + ')';
        params.push(`%${search}%`);
      }

      queryText += ` ORDER BY ${orderBy} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding all products:', error);
      throw error;
    }
  },

  async count(shopDomain) {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM products_snapshot WHERE shop_domain = $1',
        [shopDomain]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting products:', error);
      throw error;
    }
  },

  async findByShopifyId(shopDomain, shopifyProductId) {
    try {
      const result = await query(
        'SELECT * FROM products_snapshot WHERE shop_domain = $1 AND shopify_product_id = $2',
        [shopDomain, shopifyProductId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding product by Shopify ID:', error);
      throw error;
    }
  },

  async upsert(productData) {
    try {
      const result = await query(
        `INSERT INTO products_snapshot
         (shop_domain, shopify_product_id, title, handle, vendor, product_type, status, inventory_quantity, price, image_url, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (shop_domain, shopify_product_id)
         DO UPDATE SET
           title = $3,
           handle = $4,
           vendor = $5,
           product_type = $6,
           status = $7,
           inventory_quantity = $8,
           price = $9,
           image_url = $10,
           updated_at = NOW()
         RETURNING *`,
        [
          productData.shop_domain,
          productData.shopify_product_id,
          productData.title,
          productData.handle,
          productData.vendor,
          productData.product_type,
          productData.status,
          productData.inventory_quantity,
          productData.price,
          productData.image_url
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error upserting product:', error);
      throw error;
    }
  },

  async findLowStock(shopDomain, threshold = 10) {
    try {
      const result = await query(
        'SELECT * FROM products_snapshot WHERE shop_domain = $1 AND inventory_quantity < $2 AND status = $3 ORDER BY inventory_quantity ASC',
        [shopDomain, threshold, 'active']
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding low stock products:', error);
      throw error;
    }
  },

  async getStatistics(shopDomain) {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total_products,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_products,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_products,
          SUM(inventory_quantity) as total_inventory,
          SUM(price * inventory_quantity) as total_inventory_value,
          COUNT(CASE WHEN inventory_quantity < 10 AND status = 'active' THEN 1 END) as low_stock_count
         FROM products_snapshot
         WHERE shop_domain = $1`,
        [shopDomain]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting product statistics:', error);
      throw error;
    }
  },

  async deleteByShopifyId(shopDomain, shopifyProductId) {
    try {
      await query(
        'DELETE FROM products_snapshot WHERE shop_domain = $1 AND shopify_product_id = $2',
        [shopDomain, shopifyProductId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async deleteAllForShop(shopDomain) {
    try {
      const result = await query(
        'DELETE FROM products_snapshot WHERE shop_domain = $1',
        [shopDomain]
      );
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting all products for shop:', error);
      throw error;
    }
  }
};

module.exports = Product;

