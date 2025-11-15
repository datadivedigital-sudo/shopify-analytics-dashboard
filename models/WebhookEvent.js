const { query } = require('../config/database');

const WebhookEvent = {
  async create(shopDomain, topic, payload) {
    try {
      const result = await query(
        `INSERT INTO webhook_events (shop_domain, topic, payload, received_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [shopDomain, topic, JSON.stringify(payload)]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating webhook event:', error);
      throw error;
    }
  },

  async findRecent(shopDomain, limit = 100) {
    try {
      const result = await query(
        'SELECT * FROM webhook_events WHERE shop_domain = $1 ORDER BY received_at DESC LIMIT $2',
        [shopDomain, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding recent webhook events:', error);
      throw error;
    }
  },

  async markProcessed(id) {
    try {
      const result = await query(
        'UPDATE webhook_events SET processed = true WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error marking webhook as processed:', error);
      throw error;
    }
  }
};

module.exports = WebhookEvent;

