
# Shopify Product Analytics Dashboard

A complete externally-hosted Shopify app that provides comprehensive product analytics, inventory tracking, and real-time updates via webhooks.

## Features

- ✅ OAuth 2.0 Authentication with Shopify
- ✅ Product Data Synchronization via Shopify Admin API (GraphQL)
- ✅ Real-time Analytics Dashboard with Charts (Chart.js)
- ✅ Low Stock Alerts & Inventory Monitoring
- ✅ Webhook Integration (Products Create/Update/Delete)
- ✅ GDPR Compliance (Customer & Shop Data Webhooks)
- ✅ PostgreSQL Database for Data Persistence
- ✅ Manual Sync & Background Scheduler
- ✅ Search & Filter Functionality
- ✅ Server-Side Rendering with EJS
- ✅ Rate Limiting & Error Handling

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **View Engine**: EJS (Embedded JavaScript)
- **API**: Shopify Admin API (GraphQL & REST)
- **Frontend**: Bootstrap 5, Chart.js
- **Session Management**: express-session

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- A Shopify Partner Account
- A Development Store
- ngrok (for local development) or a public server

## Quick Start

### 1. Clone & Install

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-random-secret-key

# Get these from Shopify Partner Dashboard
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SCOPES=read_products,read_orders,write_webhooks

# Your app's public URL (use ngrok for development)
HOST=https://your-app.ngrok.io

# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/shopify_analytics
```

### 3. Setup Database

```bash
# Create database
createdb shopify_analytics

# Run migrations
npm run db:migrate
```

### 4. Create Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app → Custom app
3. Configure App URLs:
   - **App URL**: `https://your-app.ngrok.io/dashboard`
   - **Allowed redirection URL(s)**: `https://your-app.ngrok.io/auth/callback`
4. Copy API Key and API Secret to `.env`

### 5. Start Development Server

```bash
# Start with nodemon (auto-reload)
npm run dev

# Or start normally
npm start
```

### 6. Install App on Development Store

1. Visit: `http://localhost:3000/`
2. Enter your development store domain (e.g., `mystore.myshopify.com`)
3. Authorize the app

### 7. Register Webhooks

After installation, register webhooks:

```bash
node scripts/registerWebhooks.js mystore.myshopify.com
```

## Project Structure

```
analytics-dashboard-complete/
├── config/
│   ├── database.js         # PostgreSQL connection
│   └── schema.sql          # Database schema
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── verifyWebhook.js    # Webhook HMAC verification
├── models/
│   ├── Shop.js             # Shop data model
│   ├── Product.js          # Product data model
│   └── WebhookEvent.js     # Webhook event model
├── routes/
│   ├── auth.js             # OAuth flow routes
│   ├── dashboard.js        # Dashboard routes
│   ├── webhooks.js         # Webhook handlers
│   └── gdpr.js             # GDPR compliance routes
├── services/
│   ├── productSync.js      # Product sync logic
│   └── syncScheduler.js    # Background sync scheduler
├── utils/
│   ├── helpers.js          # HMAC verification & utilities
│   ├── shopifyApi.js       # Shopify Admin API client
│   └── storefrontApi.js    # Shopify Storefront API client
├── views/
│   ├── layout.ejs          # Base layout
│   ├── login.ejs           # Login/install page
│   ├── dashboard.ejs       # Main dashboard
│   └── error.ejs           # Error page
├── public/
│   ├── css/
│   │   └── style.css       # Custom styles
│   └── js/
│       └── dashboard.js    # Client-side JavaScript
├── scripts/
│   ├── migrate.js          # Database migration
│   └── registerWebhooks.js # Webhook registration
├── server.js               # Main Express app
├── package.json
└── .env.example
```

## API Endpoints

### Public Routes
- `GET /` - Login/Install page
- `GET /health` - Health check

### Auth Routes
- `GET /auth` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/logout` - Logout

### Protected Routes (Require Authentication)
- `GET /dashboard` - Main analytics dashboard
- `POST /dashboard/sync` - Manual product sync

### Webhook Routes (Require HMAC Verification)
- `POST /webhooks/products/create` - Product created
- `POST /webhooks/products/update` - Product updated
- `POST /webhooks/products/delete` - Product deleted
- `POST /api/gdpr/customers/data_request` - Customer data request
- `POST /api/gdpr/customers/redact` - Customer data deletion
- `POST /api/gdpr/shop/redact` - Shop data deletion

## Database Schema

### shops
Stores installed shop information and access tokens.

### products_snapshot
Caches product data from Shopify for fast dashboard rendering.

### webhook_events
Logs all incoming webhook events for audit and debugging.

## Key Features Explained

### 1. OAuth Authentication
Secure installation flow following Shopify's best practices with nonce and HMAC verification.

### 2. Product Synchronization
Uses GraphQL Admin API with pagination to fetch all products efficiently, respecting rate limits.

### 3. Analytics Dashboard
Real-time dashboard with:
- Statistics cards (total, active, inventory, alerts)
- Bar chart (top products by inventory)
- Pie chart (product status distribution)
- Low stock alerts table
- Searchable product list

### 4. Webhooks
Real-time data updates when products are created, updated, or deleted in Shopify.

### 5. GDPR Compliance
Mandatory webhooks for customer and shop data deletion requests.

### 6. Background Sync (Optional)
Automated product synchronization every 15 minutes (disabled by default).

## Development Tips

### Using ngrok for Development

```bash
# Start ngrok
ngrok http 3000

# Copy HTTPS URL to .env as HOST
HOST=https://abc123.ngrok.io
```

### Testing Webhooks Locally

1. Start ngrok
2. Update HOST in `.env`
3. Register webhooks: `node scripts/registerWebhooks.js mystore.myshopify.com`
4. Trigger events in Shopify Admin
5. Check server logs for webhook receipts

### Database Management

```bash
# Access PostgreSQL
psql shopify_analytics

# View tables
\dt

# View products
SELECT * FROM products_snapshot;

# View shops
SELECT * FROM shops;

# View webhook events
SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT 10;
```

## Deployment

### Render.com (Recommended)

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

### Other Platforms

This app can be deployed to:
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Vercel (with serverless functions)
- Any VPS with Node.js and PostgreSQL

## Security Features

- ✅ HMAC verification for OAuth and webhooks
- ✅ Nonce validation for OAuth flow
- ✅ Secure session management with httpOnly cookies
- ✅ Rate limiting for Shopify API calls
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (EJS escaping)
- ✅ Environment-based configuration
- ✅ HTTPS-only cookies in production

## Troubleshooting

### "Shop not found" error
- Ensure shop is installed via OAuth flow
- Check `shops` table in database

### Webhooks not receiving
- Verify ngrok is running
- Check webhook registration: `node scripts/registerWebhooks.js`
- Confirm HOST in `.env` matches ngrok URL
- Test webhook HMAC verification

### "Invalid HMAC" error
- Verify `SHOPIFY_API_SECRET` in `.env`
- Check webhook middleware is properly configured
- Ensure raw body parsing is enabled for webhooks

### Products not syncing
- Check Shopify API credentials
- Verify shop access token is valid
- Review API scopes (need `read_products`)
- Check rate limiting logs

## Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run database migrations
npm run db:migrate

# Register webhooks (requires shop domain)
node scripts/registerWebhooks.js mystore.myshopify.com
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `SHOPIFY_API_KEY` | Shopify app API key | Yes |
| `SHOPIFY_API_SECRET` | Shopify app API secret | Yes |
| `SCOPES` | Comma-separated API scopes | Yes |
| `HOST` | Public app URL (https://) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `STOREFRONT_ACCESS_TOKEN` | Storefront API token | No |
| `ENABLE_AUTO_SYNC` | Enable background sync (true/false) | No |

## Contributing

This is an educational project for Shopify app development training.

## License

MIT License - Feel free to use for learning and commercial projects.

## Support

For questions and issues:
1. Review the tutorial documentation
2. Check `TROUBLESHOOTING.md`
3. Consult Shopify API documentation
4. Contact your instructor

## Acknowledgments

- Built with [Shopify Admin API](https://shopify.dev/api/admin)
- UI powered by [Bootstrap 5](https://getbootstrap.com/)
- Charts by [Chart.js](https://www.chartjs.org/)
- Inspired by Shopify's embedded app examples

---

**Happy Building! 🚀**

