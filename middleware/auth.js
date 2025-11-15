const Shop = require('../models/Shop');

async function verifyAuth(req, res, next) {
  try {
    // Check if session has shop
    if (!req.session.shop) {
      return res.redirect('/auth?shop=' + (req.query.shop || ''));
    }

    // Load shop from database
    const shop = await Shop.findByShop(req.session.shop);

    if (!shop || !shop.access_token) {
      req.session.destroy();
      return res.redirect('/auth?shop=' + req.session.shop);
    }

    // Attach shop to request
    req.shop = shop;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).render('error', {
      title: 'Authentication Error',
      error: 'Failed to verify authentication'
    });
  }
}

module.exports = {
  verifyAuth
};

