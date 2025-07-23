/**
 * Security Headers Configuration
 * 
 * This module provides security header configurations for various deployment environments.
 * These headers should be implemented at the server level (Nginx, Apache, CDN, etc.)
 */

// Content Security Policy configuration
export const CSP_CONFIG = {
  // Strict CSP for production
  strict: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Astro inline scripts
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
      'https://picsum.photos', // For demo images
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
  
  // Relaxed CSP for development
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
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

// Generate CSP header string
export function generateCSPHeader(config = CSP_CONFIG.strict) {
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

// Nginx configuration example
export const NGINX_CONFIG = `
# Security headers configuration for Nginx
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;

# Content Security Policy
add_header Content-Security-Policy "${generateCSPHeader()}" always;

# Permissions Policy
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()" always;

# Remove server tokens
server_tokens off;

# Limit request size
client_max_body_size 10M;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

# Apply rate limiting
location /api/ {
    limit_req zone=api burst=20 nodelay;
}

location /login {
    limit_req zone=login burst=5 nodelay;
}
`;

// Apache configuration example
export const APACHE_CONFIG = `
# Security headers configuration for Apache
<IfModule mod_headers.c>
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set Cross-Origin-Embedder-Policy "require-corp"
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Resource-Policy "same-origin"
    
    # Content Security Policy
    Header always set Content-Security-Policy "${generateCSPHeader()}"
    
    # Permissions Policy
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()"
    
    # Remove server signature
    Header unset Server
    Header unset X-Powered-By
</IfModule>

# Disable server signature
ServerTokens Prod
ServerSignature Off

# Limit request size
LimitRequestBody 10485760

# Rate limiting (requires mod_evasive)
<IfModule mod_evasive24.c>
    DOSHashTableSize    2048
    DOSPageCount        10
    DOSPageInterval     1
    DOSSiteCount        50
    DOSSiteInterval     1
    DOSBlockingPeriod   600
</IfModule>
`;

// Cloudflare configuration example
export const CLOUDFLARE_CONFIG = {
  // Page Rules
  pageRules: [
    {
      url: "hackmum.in/*",
      settings: {
        "security_level": "medium",
        "cache_level": "cache_everything",
        "edge_cache_ttl": 7200,
        "browser_cache_ttl": 14400
      }
    }
  ],
  
  // Security settings
  security: {
    "waf": "on",
    "rate_limiting": {
      "threshold": 1000,
      "period": 60,
      "action": "challenge"
    },
    "bot_management": "on",
    "ddos_protection": "on"
  },
  
  // Transform Rules for headers
  transformRules: [
    {
      "action": "rewrite",
      "expression": "true",
      "description": "Add security headers",
      "headers": {
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    }
  ]
};

// Vercel configuration (vercel.json)
export const VERCEL_CONFIG = {
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": generateCSPHeader()
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        }
      ]
    }
  ]
};

// Netlify configuration (_headers file)
export const NETLIFY_CONFIG = `
/*
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: ${generateCSPHeader()}
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
`;

// Security testing utilities
export const SECURITY_TESTS = {
  // Test CSP implementation
  testCSP() {
    // Try to execute inline script (should be blocked)
    try {
      // Use Function constructor instead of eval for safer testing
      const testFunction = new Function('console.log("CSP test - this should be blocked")');
      testFunction();
      return { passed: false, message: 'CSP not blocking dynamic code execution' };
    } catch (e) {
      return { passed: true, message: 'CSP successfully blocking dynamic code execution' };
    }
  },
  
  // Test XSS protection
  testXSS() {
    const testElement = document.createElement('div');
    testElement.innerHTML = '<script>alert("XSS")</script>';
    
    const hasScript = testElement.querySelector('script');
    return {
      passed: !hasScript,
      message: hasScript ? 'XSS protection failed' : 'XSS protection working'
    };
  },
  
  // Test HTTPS enforcement
  testHTTPS() {
    const isHTTPS = location.protocol === 'https:';
    return {
      passed: isHTTPS,
      message: isHTTPS ? 'HTTPS enforced' : 'HTTPS not enforced'
    };
  },
  
  // Test security headers
  async testSecurityHeaders() {
    try {
      const response = await fetch(location.href, { method: 'HEAD' });
      const headers = {};
      
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      
      const requiredHeaders = [
        'x-xss-protection',
        'x-content-type-options',
        'x-frame-options',
        'referrer-policy'
      ];
      
      const missingHeaders = requiredHeaders.filter(header => !headers[header]);
      
      return {
        passed: missingHeaders.length === 0,
        message: missingHeaders.length === 0 
          ? 'All security headers present' 
          : `Missing headers: ${missingHeaders.join(', ')}`,
        headers
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Failed to test security headers',
        error: error.message
      };
    }
  },
  
  // Run all security tests
  async runAllTests() {
    const results = {
      csp: this.testCSP(),
      xss: this.testXSS(),
      https: this.testHTTPS(),
      headers: await this.testSecurityHeaders()
    };
    
    const passed = Object.values(results).every(result => result.passed);
    
    return {
      passed,
      results,
      summary: `${Object.values(results).filter(r => r.passed).length}/${Object.keys(results).length} tests passed`
    };
  }
};

// Export configuration for different environments
export function getSecurityConfig(environment = 'production') {
  const config = {
    csp: environment === 'development' ? CSP_CONFIG.development : CSP_CONFIG.strict,
    headers: SECURITY_HEADERS
  };
  
  // Remove HTTPS-only headers in development
  if (environment === 'development') {
    delete config.headers['Strict-Transport-Security'];
    delete config.headers['Cross-Origin-Embedder-Policy'];
  }
  
  return config;
}

console.log('🔒 Security headers configuration loaded');