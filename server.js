/**
 * Shopify Analytics Dashboard - Main Server File
 * Complete Implementation
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ============================================================================
// VIEW ENGINE CONFIGURATION
// ============================================================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================================
// ROUTES
// ============================================================================

app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/webhooks', require('./routes/webhooks'));
app.use('/api/gdpr', require('./routes/gdpr'));

// Home Route
app.get('/', (req, res) => {
  res.render('login', {
    title: 'Product Analytics Dashboard',
    error: null
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  if (req.accepts('html')) {
    res.status(err.status || 500).render('error', {
      error: errorMessage,
      title: 'Error'
    });
  } else {
    res.status(err.status || 500).json({
      error: errorMessage
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3000;

// Start background sync scheduler (optional)
if (process.env.ENABLE_AUTO_SYNC === 'true') {
  const { startScheduler } = require('./services/syncScheduler');
  startScheduler();
}

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Shopify Analytics Dashboard');
  console.log('========================================');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏪 Ready to accept Shopify app installations`);
  console.log('========================================');
});

