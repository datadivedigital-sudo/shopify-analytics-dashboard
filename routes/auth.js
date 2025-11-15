const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyHmac, isValidShopDomain, generateNonce, buildAuthUrl } = require('../utils/helpers');
const Shop = require('../models/Shop');

// GET /auth - Start OAuth Installation
router.get('/', (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).render('error', {
        title: 'Missing Shop Parameter',
        error: 'Please provide a shop parameter. Example: /auth?shop=yourstore.myshopify.com'
      });
    }

    if (!isValidShopDomain(shop)) {
      return res.status(400).render('error', {
        title: 'Invalid Shop Domain',
        error: 'Shop domain must be in format: yourstore.myshopify.com'
      });
    }

    const nonce = generateNonce();
    req.session.nonce = nonce;

    const authUrl = buildAuthUrl(
      shop,
      process.env.SHOPIFY_API_KEY,
      process.env.SCOPES,
      `${process.env.HOST}/auth/callback`,
      nonce
    );

    res.redirect(authUrl);
  } catch (error) {
    console.error('Error in /auth route:', error);
    res.status(500).render('error', {
      title: 'Installation Error',
      error: 'An error occurred during installation. Please try again.'
    });
  }
});

// GET /auth/callback - OAuth Callback Handler
router.get('/callback', async (req, res) => {
  try {
    const hmacValid = verifyHmac(req.query, process.env.SHOPIFY_API_SECRET);

    if (!hmacValid) {
      console.error('HMAC verification failed');
      return res.status(401).render('error', {
        title: 'Invalid Request',
        error: 'HMAC verification failed. This request did not come from Shopify.'
      });
    }

    const { code, shop, state } = req.query;

    if (!code || !shop || !state) {
      return res.status(400).render('error', {
        title: 'Missing Parameters',
        error: 'Required OAuth parameters are missing.'
      });
    }

    if (state !== req.session.nonce) {
      console.error('Nonce mismatch');
      return res.status(401).render('error', {
        title: 'Invalid State',
        error: 'State parameter does not match. Possible CSRF attack.'
      });
    }

    const tokenUrl = `https://${shop}/admin/oauth/access_token`;

    const tokenResponse = await axios.post(tokenUrl, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code: code
    });

    const { access_token, scope } = tokenResponse.data;

    if (!access_token) {
      throw new Error('No access token returned from Shopify');
    }

    console.log('✓ Access token received for shop:', shop);

    await Shop.create(shop, access_token, scope);

    console.log('✓ Shop saved to database:', shop);

    req.session.shop = shop;
    delete req.session.nonce;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error in /auth/callback:', error);

    if (error.response) {
      console.error('Shopify API Error:', error.response.data);
    }

    res.status(500).render('error', {
      title: 'Installation Failed',
      error: 'Failed to complete installation. Please try again.'
    });
  }
});

// POST /auth/logout - Logout Handler
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;

