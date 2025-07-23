/**
 * Security Enhancement Suite
 * External script for handling various security features
 */

// Security Enhancement Suite Class
class SecurityEnhancements {
  constructor(options = {}) {
    this.enableCSP = options.enableCSP ?? true;
    this.enableXSSProtection = options.enableXSSProtection ?? true;
    this.enableInputSanitization = options.enableInputSanitization ?? true;
    this.enableFormValidation = options.enableFormValidation ?? true;
    this.enableSecureLinks = options.enableSecureLinks ?? true;
    this.logSecurityEvents = options.logSecurityEvents ?? true;
    
    this.securityViolations = [];
    this.sanitizationRules = this.getDefaultSanitizationRules();
    
    this.init();
  }
  
  init() {
    console.log('🔒 Security enhancements initialized');
    
    // Initialize security features
    if (this.enableCSP) {
      this.initCSPMonitoring();
    }
    
    if (this.enableXSSProtection) {
      this.initXSSProtection();
    }
    
    if (this.enableInputSanitization) {
      this.initInputSanitization();
    }
    
    if (this.enableFormValidation) {
      this.initFormValidation();
    }
    
    if (this.enableSecureLinks) {
      this.initSecureLinks();
    }
    
    // Set up global security monitoring
    this.initGlobalSecurityMonitoring();
  }
  
  initCSPMonitoring() {
    // Monitor CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = {
        type: 'csp_violation',
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy,
        timestamp: new Date().toISOString()
      };
      
      this.logSecurityViolation(violation);
      
      // Take action based on violation type
      if (event.violatedDirective.includes('script-src')) {
        console.warn('🚨 Blocked potentially malicious script:', event.blockedURI);
      }
    });
  }
  
  initXSSProtection() {
    // Monitor for potential XSS attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElementForXSS(node);
            }
          });
        }
        
        if (mutation.type === 'attributes') {
          this.scanAttributeForXSS(mutation.target, mutation.attributeName);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover', 'href', 'src']
    });
  }
  
  scanElementForXSS(element) {
    // Check for dangerous elements
    const dangerousElements = ['script', 'iframe', 'object', 'embed'];
    if (dangerousElements.includes(element.tagName.toLowerCase())) {
      const src = element.src || element.innerHTML;
      if (this.containsXSSPattern(src)) {
        this.logSecurityViolation({
          type: 'xss_attempt',
          element: element.tagName,
          content: src,
          timestamp: new Date().toISOString()
        });
        
        // Remove dangerous element
        element.remove();
        console.warn('🚨 Removed potentially malicious element:', element);
      }
    }
    
    // Check innerHTML for XSS patterns
    if (element.innerHTML && this.containsXSSPattern(element.innerHTML)) {
      this.logSecurityViolation({
        type: 'xss_attempt',
        element: element.tagName,
        content: element.innerHTML,
        timestamp: new Date().toISOString()
      });
      
      // Sanitize content
      element.innerHTML = this.sanitizeHTML(element.innerHTML);
    }
  }
  
  scanAttributeForXSS(element, attributeName) {
    const attributeValue = element.getAttribute(attributeName);
    if (attributeValue && this.containsXSSPattern(attributeValue)) {
      this.logSecurityViolation({
        type: 'xss_attempt',
        element: element.tagName,
        attribute: attributeName,
        content: attributeValue,
        timestamp: new Date().toISOString()
      });
      
      // Remove dangerous attribute
      element.removeAttribute(attributeName);
      console.warn('🚨 Removed potentially malicious attribute:', attributeName, 'from', element);
    }
  }
  
  containsXSSPattern(input) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  initInputSanitization() {
    // Sanitize all form inputs on change
    document.addEventListener('input', (event) => {
      if (event.target.matches('input, textarea')) {
        const originalValue = event.target.value;
        const sanitizedValue = this.sanitizeInput(originalValue);
        
        if (originalValue !== sanitizedValue) {
          event.target.value = sanitizedValue;
          this.logSecurityViolation({
            type: 'input_sanitized',
            field: event.target.name || event.target.id,
            original: originalValue,
            sanitized: sanitizedValue,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    // Sanitize paste events
    document.addEventListener('paste', (event) => {
      if (event.target.matches('input, textarea')) {
        setTimeout(() => {
          const originalValue = event.target.value;
          const sanitizedValue = this.sanitizeInput(originalValue);
          
          if (originalValue !== sanitizedValue) {
            event.target.value = sanitizedValue;
            this.logSecurityViolation({
              type: 'paste_sanitized',
              field: event.target.name || event.target.id,
              original: originalValue,
              sanitized: sanitizedValue,
              timestamp: new Date().toISOString()
            });
          }
        }, 0);
      }
    });
  }
  
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Apply sanitization rules
    let sanitized = input;
    
    this.sanitizationRules.forEach(rule => {
      sanitized = sanitized.replace(rule.pattern, rule.replacement);
    });
    
    return sanitized;
  }
  
  sanitizeHTML(html) {
    if (typeof html !== 'string') return html;
    
    // Basic HTML sanitization
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  getDefaultSanitizationRules() {
    return [
      // Remove script tags
      {
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        replacement: ''
      },
      // Remove javascript: URLs
      {
        pattern: /javascript:/gi,
        replacement: ''
      },
      // Remove event handlers
      {
        pattern: /on\w+\s*=/gi,
        replacement: ''
      },
      // Remove iframe tags
      {
        pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        replacement: ''
      },
      // Remove object/embed tags
      {
        pattern: /<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
        replacement: ''
      },
      // Remove data URLs with HTML content
      {
        pattern: /data:text\/html[^"']*/gi,
        replacement: ''
      }
    ];
  }
  
  initFormValidation() {
    // Enhanced form validation
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        const isValid = this.validateForm(form);
        if (!isValid) {
          event.preventDefault();
          console.warn('🚨 Form submission blocked due to security validation failure');
        }
      }
    });
  }
  
  validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Skip hidden security fields
      if (input.type === 'hidden' && 
          (input.name === 'csrf_token' || input.name === 'form_signature' || input.name === 'form_timestamp')) {
        return;
      }
      
      const value = input.value;
      
      // Check for XSS attempts
      if (this.containsXSSPattern(value)) {
        this.showSecurityError(input, 'Invalid characters detected');
        this.logSecurityViolation({
          type: 'form_xss_attempt',
          field: input.name || input.id,
          value: value,
          timestamp: new Date().toISOString()
        });
        isValid = false;
      }
      
      // Check for SQL injection attempts
      if (this.containsSQLInjection(value)) {
        this.showSecurityError(input, 'Invalid input detected');
        this.logSecurityViolation({
          type: 'form_sql_injection_attempt',
          field: input.name || input.id,
          value: value,
          timestamp: new Date().toISOString()
        });
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  containsSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(;|\-\-|\/\*|\*\/)/g,
      /(\b(EXEC|EXECUTE)\s*\()/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  showSecurityError(input, message) {
    // Remove existing error
    const existingError = input.parentNode.querySelector('.security-error');
    if (existingError) existingError.remove();
    
    // Add error message
    const error = document.createElement('div');
    error.className = 'security-error';
    error.textContent = message;
    error.style.cssText = `
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      padding: 0.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.25rem;
    `;
    
    input.parentNode.insertBefore(error, input.nextSibling);
    input.style.borderColor = '#ef4444';
  }
  
  initSecureLinks() {
    // Secure external links
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link && link.href) {
        this.secureLink(link);
      }
    });
    
    // Process existing links
    document.querySelectorAll('a[href]').forEach(link => {
      this.secureLink(link);
    });
  }
  
  secureLink(link) {
    const url = new URL(link.href, window.location.origin);
    
    // Check if it's an external link
    if (url.origin !== window.location.origin) {
      // Add security attributes
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      
      // Check for suspicious URLs
      if (this.isSuspiciousURL(url)) {
        this.logSecurityViolation({
          type: 'suspicious_link',
          url: url.href,
          timestamp: new Date().toISOString()
        });
        
        // Add warning
        link.addEventListener('click', (event) => {
          const proceed = confirm('This link appears suspicious. Do you want to continue?');
          if (!proceed) {
            event.preventDefault();
          }
        });
      }
    }
    
    // Check for javascript: URLs
    if (url.protocol === 'javascript:') {
      this.logSecurityViolation({
        type: 'javascript_url',
        url: url.href,
        timestamp: new Date().toISOString()
      });
      
      // Remove javascript: URL
      link.href = '#';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        console.warn('🚨 Blocked javascript: URL');
      });
    }
  }
  
  isSuspiciousURL(url) {
    const suspiciousPatterns = [
      /\d+\.\d+\.\d+\.\d+/, // IP addresses
      /[a-z0-9]{20,}\./, // Very long random subdomains
      /\.(tk|ml|ga|cf)$/, // Suspicious TLDs
      /bit\.ly|tinyurl|t\.co/, // URL shorteners (could be suspicious)
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url.hostname));
  }
  
  initGlobalSecurityMonitoring() {
    // Monitor for security-related events
    window.addEventListener('error', (event) => {
      // Check if error might be security-related
      if (event.message && event.message.includes('Content Security Policy')) {
        this.logSecurityViolation({
          type: 'csp_error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Monitor for console access (potential debugging attempts)
    let consoleAccessCount = 0;
    const originalConsole = window.console;
    
    Object.keys(originalConsole).forEach(method => {
      if (typeof originalConsole[method] === 'function') {
        const originalMethod = originalConsole[method];
        window.console[method] = function(...args) {
          consoleAccessCount++;
          
          // Log excessive console usage (potential debugging/tampering)
          if (consoleAccessCount > 100) {
            this.logSecurityViolation({
              type: 'excessive_console_usage',
              count: consoleAccessCount,
              timestamp: new Date().toISOString()
            });
          }
          
          return originalMethod.apply(this, args);
        }.bind(this);
      }
    });
    
    // Monitor for developer tools
    let devtools = {
      open: false,
      orientation: null
    };
    
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.logSecurityViolation({
            type: 'devtools_opened',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }
  
  logSecurityViolation(violation) {
    this.securityViolations.push(violation);
    
    if (this.logSecurityEvents) {
      console.warn('🚨 Security Event:', violation);
    }
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('security-violation', {
      detail: violation
    }));
    
    // Send to analytics if configured
    if (typeof gtag !== 'undefined') {
      gtag('event', 'security_violation', {
        event_category: 'Security',
        event_label: violation.type,
        value: 1
      });
    }
  }
  
  // Public API methods
  getSecurityViolations() {
    return this.securityViolations;
  }
  
  clearSecurityViolations() {
    this.securityViolations = [];
  }
  
  addSanitizationRule(pattern, replacement) {
    this.sanitizationRules.push({ pattern, replacement });
  }
  
  testSecurity() {
    console.log('🔍 Running security tests...');
    
    const tests = {
      csp: this.testCSP(),
      xss: this.testXSSProtection(),
      forms: this.testFormValidation(),
      links: this.testLinkSecurity()
    };
    
    const passed = Object.values(tests).filter(test => test.passed).length;
    const total = Object.keys(tests).length;
    
    console.log(`✅ Security tests: ${passed}/${total} passed`);
    return tests;
  }
  
  testCSP() {
    try {
      // This should be blocked by CSP
      const testFunction = new Function('return true');
      testFunction();
      return { passed: false, message: 'CSP not blocking dynamic code execution' };
    } catch (e) {
      return { passed: true, message: 'CSP working correctly' };
    }
  }
  
  testXSSProtection() {
    const testElement = document.createElement('div');
    testElement.innerHTML = '<script>alert("test")</script>';
    
    const hasScript = testElement.querySelector('script');
    return {
      passed: !hasScript,
      message: hasScript ? 'XSS protection failed' : 'XSS protection working'
    };
  }
  
  testFormValidation() {
    const testInput = '<script>alert("xss")</script>';
    const isBlocked = this.containsXSSPattern(testInput);
    
    return {
      passed: isBlocked,
      message: isBlocked ? 'Form validation working' : 'Form validation failed'
    };
  }
  
  testLinkSecurity() {
    const testLink = document.createElement('a');
    testLink.href = 'javascript:alert("test")';
    this.secureLink(testLink);
    
    return {
      passed: testLink.href === '#',
      message: testLink.href === '#' ? 'Link security working' : 'Link security failed'
    };
  }
}

// Export for use in other modules
window.SecurityEnhancements = SecurityEnhancements;