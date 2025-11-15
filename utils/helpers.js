/**
 * Utility Helper Functions
 *
 * Common functions used throughout the application
 * Pre-configured in the boilerplate for students
 */

const crypto = require('crypto');

// ============================================================================
// HMAC VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify HMAC Signature from Shopify OAuth
 *
 * When Shopify redirects back to your app during OAuth, it includes an HMAC
 * signature to prove the request is authentic and hasn't been tampered with.
 *
 * How it works:
 * 1. Shopify creates a message from all query parameters (except hmac itself)
 * 2. Shopify signs the message with your API Secret using HMAC-SHA256
 * 3. Shopify includes the signature as the 'hmac' query parameter
 * 4. Your app verifies by computing the same signature and comparing
 *
 * @param {object} query - Query parameters from the URL (req.query)
 * @param {string} secret - Your Shopify API Secret
 * @returns {boolean} True if HMAC is valid, false otherwise
 *
 * @example
 * const isValid = verifyHmac(req.query, process.env.SHOPIFY_API_SECRET);
 * if (!isValid) {
 *   return res.status(400).send('Invalid HMAC');
 * }
 */
function verifyHmac(query, secret) {
  // Extract the HMAC that Shopify sent
  const { hmac, ...params } = query;

  if (!hmac) {
    return false; // No HMAC provided
  }

  // Build the message string from parameters
  // 1. Sort parameters alphabetically by key
  // 2. Join as key=value pairs with & separator
  // Example: "code=abc123&shop=mystore.myshopify.com&timestamp=1234567890"
  const message = Object.keys(params)
    .sort() // Alphabetical order is important!
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Compute the HMAC signature
  // - Use HMAC-SHA256 algorithm
  // - Sign with your API Secret
  // - Output as hexadecimal string
  const hash = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  // Compare computed hash with provided hash
  // Use timingSafeEqual to prevent timing attacks
  // (constant-time comparison)
  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const hmacBuffer = Buffer.from(hmac, 'hex');

    // Buffers must be same length to compare
    if (hashBuffer.length !== hmacBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, hmacBuffer);
  } catch (e) {
    // If conversion to buffer fails, invalid HMAC
    return false;
  }
}

/**
 * Verify Webhook HMAC from Header
 *
 * When Shopify sends a webhook, it includes an HMAC signature in the
 * X-Shopify-Hmac-Sha256 header to prove authenticity.
 *
 * How it works:
 * 1. Shopify computes HMAC-SHA256 of the raw request body
 * 2. Shopify base64-encodes the hash and puts it in the header
 * 3. Your app verifies by computing the same hash and comparing
 *
 * IMPORTANT: You must use the RAW request body (before JSON parsing)
 *
 * @param {string|Buffer} body - Raw request body (use express.raw())
 * @param {string} hmacHeader - Value from X-Shopify-Hmac-Sha256 header
 * @param {string} secret - Your Shopify API Secret
 * @returns {boolean} True if HMAC is valid, false otherwise
 *
 * @example
 * app.post('/webhooks', express.raw({type: 'application/json'}), (req, res) => {
 *   const hmac = req.get('X-Shopify-Hmac-Sha256');
 *   const isValid = verifyWebhookHmac(req.body, hmac, process.env.SHOPIFY_API_SECRET);
 *   if (!isValid) {
 *     return res.status(401).send('Invalid webhook');
 *   }
 *   // Process webhook...
 * });
 */
function verifyWebhookHmac(body, hmacHeader, secret) {
  if (!hmacHeader) {
    return false; // No HMAC header provided
  }

  // Ensure body is a string (might be Buffer)
  const bodyString = body.toString('utf8');

  // Compute the HMAC signature
  // - Use HMAC-SHA256 algorithm
  // - Sign with your API Secret
  // - Output as base64 string (webhooks use base64, not hex)
  const hash = crypto
    .createHmac('sha256', secret)
    .update(bodyString, 'utf8')
    .digest('base64');

  // Compare computed hash with provided hash
  // Use timingSafeEqual for constant-time comparison
  try {
    const hashBuffer = Buffer.from(hash, 'utf8');
    const hmacBuffer = Buffer.from(hmacHeader, 'utf8');

    // Buffers must be same length to compare
    if (hashBuffer.length !== hmacBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, hmacBuffer);
  } catch (e) {
    return false;
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Shop Domain Format
 *
 * Shopify shop domains must match the pattern: [store-name].myshopify.com
 * This prevents injection attacks and ensures valid shop domains.
 *
 * Valid examples:
 * - my-store.myshopify.com
 * - test-shop-123.myshopify.com
 *
 * Invalid examples:
 * - mystore.com (not a myshopify.com domain)
 * - my store.myshopify.com (contains space)
 * - my_store.myshopify.com (contains underscore)
 *
 * @param {string} shop - Shop domain to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidShopDomain(shop) {
  if (!shop) return false;

  // Regular expression pattern:
  // ^          - Start of string
  // [a-z0-9-]+ - One or more lowercase letters, numbers, or hyphens
  // \.         - Literal dot
  // myshopify  - Literal text "myshopify"
  // \.com      - Literal ".com"
  // $          - End of string
  const shopRegex = /^[a-z0-9-]+\.myshopify\.com$/;

  return shopRegex.test(shop);
}

// ============================================================================
// SECURITY FUNCTIONS
// ============================================================================

/**
 * Generate Nonce (Number Used Once)
 *
 * A nonce is a random string used once for security purposes.
 * In OAuth, we use it to prevent replay attacks:
 * 1. Generate nonce and store in session
 * 2. Include nonce in OAuth redirect
 * 3. When Shopify redirects back, verify nonce matches
 *
 * This ensures the callback is from the same browser session
 * that initiated the OAuth flow.
 *
 * @returns {string} Random 32-character hexadecimal string
 */
function generateNonce() {
  // Generate 16 random bytes and convert to hexadecimal
  // 16 bytes = 32 hex characters
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate State Parameter
 *
 * Similar to nonce, used for OAuth CSRF protection
 *
 * @returns {string} Random 32-character hexadecimal string
 */
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// ============================================================================
// SHOPIFY API HELPERS
// ============================================================================

/**
 * Extract Shop Domain from Request
 *
 * Shop domain can come from multiple sources:
 * - Query parameter: ?shop=mystore.myshopify.com
 * - Session: req.session.shop
 * - Header: X-Shopify-Shop-Domain
 *
 * @param {object} req - Express request object
 * @returns {string|null} Shop domain or null if not found
 */
function getShopFromRequest(req) {
  // Try query parameter first
  if (req.query.shop) {
    return req.query.shop;
  }

  // Try session
  if (req.session && req.session.shop) {
    return req.session.shop;
  }

  // Try header (webhooks include this)
  if (req.get('X-Shopify-Shop-Domain')) {
    return req.get('X-Shopify-Shop-Domain');
  }

  return null;
}

/**
 * Build Shopify Authorization URL
 *
 * Constructs the URL to redirect merchants to for OAuth authorization
 *
 * @param {string} shop - Shop domain (e.g., "mystore.myshopify.com")
 * @param {string} apiKey - Your Shopify API Key
 * @param {string} scopes - Comma-separated list of scopes
 * @param {string} redirectUri - Your OAuth callback URL
 * @param {string} nonce - Random nonce for security
 * @returns {string} Full authorization URL
 */
function buildAuthUrl(shop, apiKey, scopes, redirectUri, nonce) {
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state: nonce, // Include nonce as state parameter
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

module.exports = {
  // HMAC verification
  verifyHmac,
  verifyWebhookHmac,

  // Validation
  isValidShopDomain,

  // Security
  generateNonce,
  generateState,

  // Shopify helpers
  getShopFromRequest,
  buildAuthUrl,
};

