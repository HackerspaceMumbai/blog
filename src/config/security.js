/**
 * Comprehensive Security Configuration
 * Centralized security settings for the application
 */

// External script integrity hashes
export const SCRIPT_INTEGRITY = {
  'web-vitals': 'sha384-tUgwVZ2bKq/fuT9mwiC3+HXDJki4u+mELqxwTbti8M20qg2kokVmY3/j4uvnqiG6',
  'axe-core': 'sha384-law4G6M5XLjSyuk7yuJ9NNSEDs8W3cCcfCBj3B7YeRWiFy58La4JyEMGmpA2MgNj'
};

// Trusted external script sources
export const TRUSTED_SCRIPTS = {
  'web-vitals': 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js',
  'axe-core': 'https://unpkg.com/axe-core@4.8.4/axe.min.js'
};

// Content Security Policy configuration
export const CSP_CONFIG = {
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://unpkg.com/web-vitals@3',
      'https://unpkg.com/axe-core@4.8.4'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https:'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:'
    ],
    'font-src': [
      "'self'",
      'https:',
      'data:'
    ],
    'connect-src': [
      "'self'",
      'https:'
    ],
    'media-src': ["'self'", 'https:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'report-uri': ['/api/csp-report'],
    'report-to': ['csp-endpoint'],
    'upgrade-insecure-requests': true
  },development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https:',
      'http://localhost:*',
      'ws://localhost:*'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https:'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'http:'
    ],
    'font-src': [
      "'self'",
      'https:',
      'data:'
    ],
    'connect-src': [
      "'self'",
      'https:',
      'http:',
      'ws:',
      'wss:'
    ],
    'media-src': ["'self'", 'https:', 'http:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  }
};

// Security headers configuration
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'bluetooth=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()'
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

// Form security configuration
export const FORM_SECURITY = {
  // CSRF protection settings
  csrf: {
    enabled: true,
    tokenLength: 32,
    sessionKey: 'csrf_token',
    headerName: 'X-CSRF-Token'
  },
  
  // Rate limiting settings
  rateLimit: {
    enabled: true,
    maxSubmissions: 5,
    windowMinutes: 10,
    minInterval: 5000 // 5 seconds between submissions
  },
  
  // Honeypot settings
  honeypot: {
    enabled: true,
    fieldName: 'website',
    hiddenClass: 'honeypot-field'
  },
  
  // Input validation settings
  validation: {
    maxLength: 1000,
    enableXSSCheck: true,
    enableSQLInjectionCheck: true,
    sanitizeInput: true
  }
};

// Input sanitization rules
export const SANITIZATION_RULES = [
  // Remove script tags
  {
    name: 'script_tags',
    pattern: /<script\b[^>]*>.*?<\/script>/gis,
    replacement: ''
  },
  // Remove javascript: URLs
  {
    name: 'javascript_urls',
    pattern: /javascript:/gi,
    replacement: ''
  },
  // Remove event handlers
  {
    name: 'event_handlers',
    pattern: /on\w+\s*=/gi,
    replacement: ''
  },
  // Remove iframe tags
  {
    name: 'iframe_tags',
    pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    replacement: ''
  },
  // Remove object/embed tags
  {
    name: 'object_embed_tags',
    pattern: /<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    replacement: ''
  },
  // Remove data URLs with HTML content
  {
    name: 'data_html_urls',
    pattern: /data:text\/html[^"']*/gi,
    replacement: ''
  },
  // Remove vbscript URLs
  {
    name: 'vbscript_urls',
    pattern: /vbscript:/gi,
    replacement: ''
  },
  // Remove CSS expressions
  {
    name: 'css_expressions',
    pattern: /expression\s*\(/gi,
    replacement: ''
  },
  // Remove SVG script elements
  {
    name: 'svg_scripts',
    pattern: /<svg[^>]*>[\s\S]*?<script[\s\S]*?<\/script>[\s\S]*?<\/svg>/gi,
    replacement: ''
  },
  // Remove SVG onload and other event attributes
  {
    name: 'svg_events',
    pattern: /<svg[^>]*\son\w+\s*=/gi,
    replacement: '<svg'
  }
];

// XSS Detection patterns
export const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi
];

// SQL Injection patterns
export const SQL_INJECTION_PATTERNS = [
  /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/gi,
  /'/gi,
  /--/gi,
  /\/\*/gi,
  /\*\//gi
];

// Suspicious URL patterns
export const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly/gi,
  /tinyurl/gi,
  /t\.co/gi,
  /goo\.gl/gi
];

// Client-side monitoring configuration
export const MONITORING_CONFIG = {
  // Detection settings
  excessiveConsoleUsage: true,
  devToolsDetection: true,
  
  // Thresholds
  consoleUsageThreshold: 100,
  devToolsCheckInterval: 500,
  
  // Logging
  logToConsole: true,
  logToAnalytics: true,
  logToEndpoint: null // Set to URL for remote logging
};

// Generate CSP header string
export function generateCSPHeader(environment = 'production') {
  const config = CSP_CONFIG[environment] || CSP_CONFIG.production;
  const directives = [];
  
  Object.entries(config).forEach(([directive, values]) => {
    if (directive === 'upgrade-insecure-requests' && values) {
      directives.push('upgrade-insecure-requests');
    } else if (Array.isArray(values)) {
      directives.push(`${directive} ${values.join(' ')}`);
    }
  });
  
  return directives.join('; ');
}

// Get security configuration for environment
export function getSecurityConfig(environment = 'production') {
  const config = {
    csp: CSP_CONFIG[environment] || CSP_CONFIG.production,
    headers: { ...SECURITY_HEADERS },
    forms: { ...FORM_SECURITY },
    monitoring: { ...MONITORING_CONFIG }
  };
  
  // Remove HTTPS-only headers in development
  if (environment === 'development') {
    delete config.headers['Strict-Transport-Security'];
    delete config.headers['Cross-Origin-Embedder-Policy'];
  }
  
  return config;
}

// Validate script integrity
export function validateScriptIntegrity(scriptName, hash) {
  const expectedHash = SCRIPT_INTEGRITY[scriptName];
  if (!expectedHash) {
    console.warn(`No integrity hash found for script: ${scriptName}`);
    return false;
  }
  
  return hash === expectedHash;
}

// Get trusted script URL with integrity
export function getTrustedScript(scriptName) {
  const url = TRUSTED_SCRIPTS[scriptName];
  const integrity = SCRIPT_INTEGRITY[scriptName];
  
  if (!url || !integrity) {
    throw new Error(`Unknown trusted script: ${scriptName}`);
  }
  
  return { url, integrity };
}

// Security utility functions
export const SecurityUtils = {
  // Check if input contains XSS patterns
  containsXSS(input) {
    return XSS_PATTERNS.some(pattern => pattern.test(input));
  },
  
  // Check if input contains SQL injection patterns
  containsSQLInjection(input) {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  },
  
  // Check if URL is suspicious
  isSuspiciousURL(url) {
    try {
      const urlObj = new URL(url);
      return SUSPICIOUS_URL_PATTERNS.some(pattern => pattern.test(urlObj.hostname));
    } catch {
      return true; // Invalid URLs are suspicious
    }
  },
  
  // Sanitize input using configured rules
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    let sanitized = input;
    SANITIZATION_RULES.forEach(rule => {
      sanitized = sanitized.replace(rule.pattern, rule.replacement);
    });
    
    return sanitized;
  },
  
  // Generate CSRF token
  generateCSRFToken() {
    const array = new Uint8Array(FORM_SECURITY.csrf.tokenLength);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      throw new Error('Crypto API not available. Cannot generate secure CSRF token.');
    }
  },
  
  /**
   * Cryptographically secure hash function using SHA-256
   * 
   * This function replaces the insecure simpleHash implementation with a proper
   * cryptographic hash function. It works in both browser and Node.js environments.
   * 
   * @param {string} data - The data to hash
   * @param {string} encoding - Output encoding: 'hex' (default) or 'base64'
   * @returns {Promise<string>} The hash as a hex or base64 encoded string
   * 
   * @example
   * // Generate hex hash (default)
   * const hexHash = await SecurityUtils.cryptoHash('my-data');
   * 
   * @example
   * // Generate base64 hash
   * const base64Hash = await SecurityUtils.cryptoHash('my-data', 'base64');
   * 
   * @example
   * // Use for form signatures
   * const formData = JSON.stringify({ user: 'john', action: 'login' });
   * const signature = await SecurityUtils.cryptoHash(formData + secretKey);
   */
  async cryptoHash(data, encoding = 'hex') {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Check for Web Crypto API (browser) or Node.js crypto
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Browser environment - use Web Crypto API
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      
      if (encoding === 'base64') {
        // Convert to base64
        let binary = '';
        hashArray.forEach(byte => binary += String.fromCharCode(byte));
        return btoa(binary);
      } else {
        // Convert to hex (default)
        return Array.from(hashArray)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      }
    } else if (typeof require !== 'undefined') {
      // Node.js environment - use built-in crypto module
      try {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(data, 'utf8');
        return hash.digest(encoding);
      } catch (error) {
        throw new Error('Node.js crypto module not available');
      }
    } else {
      throw new Error('No secure crypto implementation available');
    }
  },
  
  /**
   * Legacy wrapper for backward compatibility (DEPRECATED)
   * 
   * @deprecated Use cryptoHash() instead for secure hashing
   * @param {string} str - The string to hash
   * @returns {Promise<string>} The hash as a hex string
   * 
   * @example
   * // ❌ DEPRECATED - Don't use this
   * const hash = await SecurityUtils.simpleHash('data');
   * 
   * // ✅ RECOMMENDED - Use this instead
   * const hash = await SecurityUtils.cryptoHash('data', 'hex');
   */
  async simpleHash(str) {
    console.warn('simpleHash is deprecated. Use cryptoHash for secure hashing.');
    return await this.cryptoHash(str, 'hex');
  }
};

console.log('🔒 Security configuration loaded');