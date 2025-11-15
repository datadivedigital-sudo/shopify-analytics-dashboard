/**
 * Sync Scheduler Service
 * Automatically syncs product data on a schedule
 */

const cron = require('node-cron');
const { fetchProducts } = require('./productSync');
const Shop = require('../models/Shop');

/**
 * Start Background Sync Scheduler
 */
function startScheduler() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('========================================');
    console.log('Running scheduled product sync...');
    console.log('========================================');

    try {
      // Get all shops
      const shops = await Shop.getAll();

      if (shops.length === 0) {
        console.log('No shops to sync');
        return;
      }

      console.log(`Syncing ${shops.length} shop(s)...`);

      for (const shop of shops) {
        try {
          console.log(`\nSyncing: ${shop.shop_domain}`);
          const result = await fetchProducts(shop.shop_domain);

          if (result.success) {
            console.log(`✓ ${shop.shop_domain}: ${result.productsCount} products synced`);
          } else {
            console.error(`✗ ${shop.shop_domain}: Sync failed - ${result.errors.join(', ')}`);
          }
        } catch (error) {
          console.error(`✗ Error syncing ${shop.shop_domain}:`, error.message);
        }
      }

      console.log('\n========================================');
      console.log('Scheduled sync complete');
      console.log('========================================\n');
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  console.log('✓ Background sync scheduler started (every 15 minutes)');
}

module.exports = {
  startScheduler
};

