const { query } = require('../config/database');

const Shop = {
  async findByShop(shopDomain) {
    try {
      const result = await query(
        'SELECT * FROM shops WHERE shop_domain = $1',
        [shopDomain]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding shop:', error);
      throw error;
    }
  },

  async create(shopDomain, accessToken, scopes) {
    try {
      const result = await query(
        `INSERT INTO shops (shop_domain, access_token, scopes, installed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (shop_domain)
         DO UPDATE SET
           access_token = $2,
           scopes = $3,
           installed_at = NOW()
         RETURNING *`,
        [shopDomain, accessToken, scopes]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating/updating shop:', error);
      throw error;
    }
  },

  async updateLastSync(shopDomain) {
    try {
      const result = await query(
        'UPDATE shops SET last_sync = NOW() WHERE shop_domain = $1 RETURNING *',
        [shopDomain]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating last sync:', error);
      throw error;
    }
  },

  async delete(shopDomain) {
    try {
      await query('DELETE FROM shops WHERE shop_domain = $1', [shopDomain]);
      return true;
    } catch (error) {
      console.error('Error deleting shop:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      const result = await query('SELECT * FROM shops ORDER BY installed_at DESC');
      return result.rows;
    } catch (error) {
      console.error('Error getting all shops:', error);
      throw error;
    }
  }
};

module.exports = Shop;

