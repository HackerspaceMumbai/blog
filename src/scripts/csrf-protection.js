/**
 * CSRF Protection Utility
 * Provides CSRF token generation and validation for forms
 */

class CSRFProtection {
  constructor() {
    this.tokenKey = 'csrf_token';
    this.tokenHeaderName = 'X-CSRF-Token';
    this.init();
  }
  
  init() {
    // Generate initial token if not exists
    if (!this.getToken()) {
      this.generateToken();
    }
    
    // Auto-inject tokens into forms
    this.injectTokensIntoForms();
    
    // Set up AJAX request interceptor
    this.setupAjaxInterceptor();
    
    // Refresh token periodically
    this.setupTokenRefresh();
  }
  
  generateToken() {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      this.setToken(token);
      return token;
    } else {
      // Fallback for older browsers
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      this.setToken(token);
      return token;
    }
  }
  
  getToken() {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(this.tokenKey);
    }
    return null;
  }
  
  setToken(token) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }
  
  injectTokensIntoForms() {
    const forms = document.querySelectorAll('form[method="post"], form[method="POST"]');
    
    forms.forEach(form => {
      // Skip if token already exists
      if (form.querySelector('input[name="csrf_token"]')) {
        return;
      }
      
      // Create hidden input for CSRF token
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'csrf_token';
      tokenInput.value = this.getToken();
      
      form.appendChild(tokenInput);
    });
  }
  
  setupAjaxInterceptor() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = (url, options = {}) => {
      // Add CSRF token to POST requests
      if (options.method && options.method.toUpperCase() === 'POST') {
        options.headers = options.headers || {};
        options.headers[this.tokenHeaderName] = this.getToken();
      }
      
      return originalFetch(url, options);
    };
    
    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      this._method = method;
      return originalOpen.call(this, method, url, async, user, password);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      if (this._method && this._method.toUpperCase() === 'POST') {
        this.setRequestHeader(window.csrfProtection.tokenHeaderName, window.csrfProtection.getToken());
      }
      return originalSend.call(this, data);
    };
  }
  
  setupTokenRefresh() {
    // Refresh token every 30 minutes
    setInterval(() => {
      this.generateToken();
      this.updateFormTokens();
    }, 30 * 60 * 1000);
    
    // Refresh token on page visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.generateToken();
        this.updateFormTokens();
      }
    });
  }
  
  updateFormTokens() {
    const tokenInputs = document.querySelectorAll('input[name="csrf_token"]');
    const newToken = this.getToken();
    
    tokenInputs.forEach(input => {
      input.value = newToken;
    });
  }
  
  validateToken(providedToken) {
    const currentToken = this.getToken();
    return currentToken && providedToken === currentToken;
  }
  
  // Public API
  refreshToken() {
    this.generateToken();
    this.updateFormTokens();
    return this.getToken();
  }
  
  // Handle form submission validation
  validateFormSubmission(form) {
    const tokenInput = form.querySelector('input[name="csrf_token"]');
    if (!tokenInput) {
      console.warn('CSRF token missing from form');
      return false;
    }
    
    if (!this.validateToken(tokenInput.value)) {
      console.warn('Invalid CSRF token');
      return false;
    }
    
    return true;
  }
}

// Initialize CSRF protection
window.csrfProtection = new CSRFProtection();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSRFProtection;
}