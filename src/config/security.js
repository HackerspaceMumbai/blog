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
  // Production CSP (strict)
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Astro inline scripts - minimize usage
      'https://unpkg.com',
      'https://cdn.jsdelivr.net',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for component styles
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'https://picsum.photos',
      'https://images.unsplash.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://api.github.com',
      'https://www.google-analytics.com'
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true
  },
  
  // Development CSP (relaxed)
  development: {
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
  
  // Prevent MIME type sniffing
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
    pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
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
  }
];

// XSS detection patterns
export const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<link\b[^<]*rel\s*=\s*["']?stylesheet["']?[^<]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi
];

// SQL injection detection patterns
export const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(;|\-\-|\/\*|\*\/)/g,
  /(\b(EXEC|EXECUTE)\s*\()/gi,
  /(\bUNION\s+(ALL\s+)?SELECT)/gi,
  /(\bINSERT\s+INTO)/gi,
  /(\bUPDATE\s+\w+\s+SET)/gi,
  /(\bDELETE\s+FROM)/gi
];

// Suspicious URL patterns
export const SUSPICIOUS_URL_PATTERNS = [
  /\d+\.\d+\.\d+\.\d+/, // IP addresses
  /[a-z0-9]{20,}\./, // Very long random subdomains
  /\.(tk|ml|ga|cf)$/, // Suspicious TLDs
  /bit\.ly|tinyurl|t\.co/, // URL shorteners
  /[^\w\-\.]/g // Non-standard characters in domain
];

// Security monitoring configuration
export const MONITORING_CONFIG = {
  // Enable different types of monitoring
  cspViolations: true,
  xssAttempts: true,
  sqlInjectionAttempts: true,
  formTampering: true,
  suspiciousLinks: true,
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
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  },
  
  // Simple hash function for form signatures
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
};

console.log('🔒 Security configuration loaded');