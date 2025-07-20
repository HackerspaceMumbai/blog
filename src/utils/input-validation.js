/**
 * Input Validation and Sanitization Utilities
 * 
 * This module provides comprehensive input validation and sanitization
 * functions to prevent XSS, SQL injection, and other security vulnerabilities.
 */

// Regular expressions for validation
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  url: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+\.?\d*$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Dangerous patterns to detect and remove
const DANGEROUS_PATTERNS = {
  // XSS patterns
  xss: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<link[^>]+href[^>]*>/gi
  ],
  
  // SQL injection patterns
  sql: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(--|\/\*|\*\/)/g,
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\b(EXEC|EXECUTE)\b)/gi,
    /(\bDROP\b.*\bTABLE\b)/gi,
    /(\bINSERT\b.*\bINTO\b)/gi,
    /(\bUPDATE\b.*\bSET\b)/gi
  ],
  
  // Command injection patterns
  command: [
    /[;&|`$(){}[\]]/g,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl|nc|telnet|ssh|ftp)\b/gi
  ],
  
  // Path traversal patterns
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ],
  
  // LDAP injection patterns
  ldap: [
    /[()&|!]/g,
    /\*(?!\w)/g
  ]
};

// HTML entities for encoding
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

/**
 * Input Validator Class
 */
export class InputValidator {
  constructor(options = {}) {
    this.strictMode = options.strictMode || false;
    this.maxLength = options.maxLength || 10000;
    this.allowedTags = options.allowedTags || [];
    this.customPatterns = options.customPatterns || {};
  }
  
  /**
   * Validate email address
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }
    
    if (email.length > 254) {
      return { valid: false, error: 'Email is too long' };
    }
    
    if (!VALIDATION_PATTERNS.email.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    // Check for suspicious patterns
    const suspicious = this.detectSuspiciousPatterns(email);
    if (suspicious.length > 0) {
      return { valid: false, error: 'Email contains suspicious content' };
    }
    
    return { valid: true, sanitized: email.toLowerCase().trim() };
  }
  
  /**
   * Validate phone number
   */
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Phone number is required' };
    }
    
    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    
    if (!VALIDATION_PATTERNS.phone.test(cleaned)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
    
    return { valid: true, sanitized: cleaned };
  }
  
  /**
   * Validate URL
   */
  validateURL(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL is required' };
    }
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
      return { valid: false, error: 'Dangerous URL protocol detected' };
    }
    
    if (!VALIDATION_PATTERNS.url.test(url)) {
      return { valid: false, error: 'Invalid URL format' };
    }
    
    return { valid: true, sanitized: url.trim() };
  }
  
  /**
   * Validate password strength
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (password.length > 128) {
      return { valid: false, error: 'Password is too long' };
    }
    
    if (!VALIDATION_PATTERNS.strongPassword.test(password)) {
      return { 
        valid: false, 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      };
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      return { valid: false, error: 'Password is too common' };
    }
    
    return { valid: true, strength: this.calculatePasswordStrength(password) };
  }
  
  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 20);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[^a-zA-Z\d]/.test(password)) score += 10;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
    
    if (score < 30) return 'weak';
    if (score < 60) return 'medium';
    if (score < 90) return 'strong';
    return 'very-strong';
  }
  
  /**
   * Sanitize HTML input
   */
  sanitizeHTML(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove dangerous patterns
    let sanitized = input;
    
    DANGEROUS_PATTERNS.xss.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // Encode HTML entities
    sanitized = sanitized.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char]);
    
    // Remove or encode remaining HTML tags
    if (this.allowedTags.length === 0) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else {
      // Allow only specified tags
      const allowedTagsRegex = new RegExp(`<(?!\/?(?:${this.allowedTags.join('|')})\b)[^>]*>`, 'gi');
      sanitized = sanitized.replace(allowedTagsRegex, '');
    }
    
    return sanitized.trim();
  }
  
  /**
   * Sanitize general text input
   */
  sanitizeText(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    if (input.length > this.maxLength) {
      input = input.substring(0, this.maxLength);
    }
    
    // Remove dangerous patterns
    let sanitized = input;
    
    Object.values(DANGEROUS_PATTERNS).forEach(patterns => {
      patterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
    });
    
    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized.trim();
  }
  
  /**
   * Detect suspicious patterns in input
   */
  detectSuspiciousPatterns(input) {
    const detected = [];
    
    Object.entries(DANGEROUS_PATTERNS).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(input)) {
          detected.push(type);
        }
      });
    });
    
    return [...new Set(detected)];
  }
  
  /**
   * Validate form data
   */
  validateForm(formData, schema) {
    const results = {};
    const errors = {};
    
    Object.entries(schema).forEach(([field, rules]) => {
      const value = formData[field];
      const fieldResult = this.validateField(value, rules);
      
      if (fieldResult.valid) {
        results[field] = fieldResult.sanitized || fieldResult.value;
      } else {
        errors[field] = fieldResult.error;
      }
    });
    
    return {
      valid: Object.keys(errors).length === 0,
      data: results,
      errors
    };
  }
  
  /**
   * Validate individual field
   */
  validateField(value, rules) {
    // Required check
    if (rules.required && (!value || value.toString().trim() === '')) {
      return { valid: false, error: 'This field is required' };
    }
    
    // Skip validation if field is empty and not required
    if (!value && !rules.required) {
      return { valid: true, value: '' };
    }
    
    // Type-specific validation
    switch (rules.type) {
      case 'email':
        return this.validateEmail(value);
      case 'phone':
        return this.validatePhone(value);
      case 'url':
        return this.validateURL(value);
      case 'password':
        return this.validatePassword(value);
      case 'text':
        return { valid: true, sanitized: this.sanitizeText(value) };
      case 'html':
        return { valid: true, sanitized: this.sanitizeHTML(value) };
      default:
        return { valid: true, value };
    }
  }
  
  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Validate CSRF token
   */
  validateCSRFToken(token, sessionToken) {
    return token && sessionToken && token === sessionToken;
  }
}

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();
  }
  
  /**
   * Check if request is allowed
   */
  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (userRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...userRequests) + this.windowMs
      };
    }
    
    // Add current request
    userRequests.push(now);
    this.requests.set(identifier, userRequests);
    
    return {
      allowed: true,
      remaining: this.maxRequests - userRequests.length,
      resetTime: now + this.windowMs
    };
  }
  
  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

/**
 * Security utilities
 */
export const SecurityUtils = {
  // Create validator instance
  createValidator(options) {
    return new InputValidator(options);
  },
  
  // Create rate limiter instance
  createRateLimiter(options) {
    return new RateLimiter(options);
  },
  
  // Quick validation functions
  isValidEmail: (email) => new InputValidator().validateEmail(email).valid,
  isValidURL: (url) => new InputValidator().validateURL(url).valid,
  isValidPhone: (phone) => new InputValidator().validatePhone(phone).valid,
  
  // Quick sanitization functions
  sanitizeHTML: (html) => new InputValidator().sanitizeHTML(html),
  sanitizeText: (text) => new InputValidator().sanitizeText(text),
  
  // Generate secure random string
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  // Hash password (client-side hashing for additional security)
  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  // Validate content security policy
  validateCSP(csp) {
    const requiredDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
    const directives = csp.split(';').map(d => d.trim().split(' ')[0]);
    
    return requiredDirectives.every(required => 
      directives.some(directive => directive === required)
    );
  }
};

// Export default validator instance
export const validator = new InputValidator();

console.log('🔒 Input validation utilities loaded');