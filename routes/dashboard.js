const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { fetchProducts } = require('../services/productSync');

// GET /dashboard - Main Dashboard
router.get('/', verifyAuth, async (req, res) => {
  try {
    const shopDomain = req.shop.shop_domain;

    // Get product statistics
    const stats = await Product.getStatistics(shopDomain);

    // Get recent products
    const products = await Product.findAll(shopDomain, {
      limit: 20,
      orderBy: 'updated_at',
      order: 'DESC'
    });

    // Get low stock products
    const lowStock = await Product.findLowStock(shopDomain, 10);

    // Get total count for pagination
    const totalProducts = await Product.count(shopDomain);

    // Prepare data for charts
    const topProducts = await Product.findAll(shopDomain, {
      limit: 10,
      orderBy: 'inventory_quantity',
      order: 'DESC'
    });

    res.render('dashboard', {
      title: 'Analytics Dashboard',
      shop: shopDomain,
      stats: {
        totalProducts: parseInt(stats.total_products) || 0,
        activeProducts: parseInt(stats.active_products) || 0,
        draftProducts: parseInt(stats.draft_products) || 0,
        totalInventory: parseInt(stats.total_inventory) || 0,
        totalValue: parseFloat(stats.total_inventory_value) || 0,
        lowStockCount: parseInt(stats.low_stock_count) || 0
      },
      products,
      lowStock,
      topProducts,
      totalProducts,
      lastSync: req.shop.last_sync,
      showNav: true
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).render('error', {
      title: 'Dashboard Error',
      error: 'Failed to load dashboard data'
    });
  }
});

// POST /dashboard/sync - Manual Sync Trigger
router.post('/sync', verifyAuth, async (req, res) => {
  try {
    const shopDomain = req.shop.shop_domain;

    console.log(`Manual sync triggered for ${shopDomain}`);

    const result = await fetchProducts(shopDomain);

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully synced ${result.productsCount} products`,
        productsCount: result.productsCount
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Sync failed: ' + result.errors.join(', ')
      });
    }
  } catch (error) {
    console.error('Error in manual sync:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed: ' + error.message
    });
  }
});

module.exports = router;

