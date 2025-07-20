// Security configuration and utilities
export interface SecurityConfig {
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    fontSrc: string[];
    connectSrc: string[];
    mediaSrc: string[];
    objectSrc: string[];
    frameSrc: string[];
    baseUri: string[];
    formAction: string[];
    frameAncestors: string[];
    upgradeInsecureRequests: boolean;
  };
  headers: {
    xContentTypeOptions: string;
    xFrameOptions: string;
    xXSSProtection: string;
    referrerPolicy: string;
    permissionsPolicy: string;
  };
  validation: {
    maxInputLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
  };
  csrf: {
    tokenLength: number;
    tokenExpiry: number;
  };
  honeypot: {
    fieldName: string;
    enabled: boolean;
  };
}

export const defaultSecurityConfig: SecurityConfig = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Astro inline scripts
      "'unsafe-eval'", // Required for some development tools
      "https://unpkg.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for component styles
      "https://fonts.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "blob:"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    connectSrc: [
      "'self'",
      "https://api.github.com",
      "https://www.google-analytics.com"
    ],
    mediaSrc: [
      "'self'",
      "https:"
    ],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true
  },
  headers: {
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    xXSSProtection: "1; mode=block",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  },
  validation: {
    maxInputLength: 10000,
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain'
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },
  csrf: {
    tokenLength: 32,
    tokenExpiry: 30 * 60 * 1000 // 30 minutes
  },
  honeypot: {
    fieldName: 'website',
    enabled: true
  }
};

// Security utility functions
export class SecurityUtils {
  static generateCSRFToken(length: number = 32): string {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto API
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  }

  static sanitizeHTML(html: string): string {
    // Create a temporary element to parse HTML
    if (typeof document === 'undefined') {
      // Server-side fallback
      return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }

    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove script tags
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove event handlers
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      });

      // Remove javascript: URLs
      ['href', 'src', 'action'].forEach(attrName => {
        const attrValue = element.getAttribute(attrName);
        if (attrValue && attrValue.toLowerCase().startsWith('javascript:')) {
          element.removeAttribute(attrName);
        }
      });
    });

    return temp.innerHTML;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^>]*>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(;|\-\-|\/\*|\*\/)/g,
      /(\b(EXEC|EXECUTE)\s*\()/gi,
      /(\b(SP_|XP_)\w+)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static generateCSPHeader(config: SecurityConfig['csp']): string {
    const directives = [
      `default-src ${config.defaultSrc.join(' ')}`,
      `script-src ${config.scriptSrc.join(' ')}`,
      `style-src ${config.styleSrc.join(' ')}`,
      `img-src ${config.imgSrc.join(' ')}`,
      `font-src ${config.fontSrc.join(' ')}`,
      `connect-src ${config.connectSrc.join(' ')}`,
      `media-src ${config.mediaSrc.join(' ')}`,
      `object-src ${config.objectSrc.join(' ')}`,
      `base-uri ${config.baseUri.join(' ')}`,
      `form-action ${config.formAction.join(' ')}`,
      `frame-ancestors ${config.frameAncestors.join(' ')}`
    ];

    if (config.frameSrc.length > 0) {
      directives.push(`frame-src ${config.frameSrc.join(' ')}`);
    }

    if (config.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }

    return directives.join('; ');
  }

  static validateFileUpload(file: File, config: SecurityConfig['validation']): {
    valid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${config.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file type
    if (!config.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i // Depending on your needs
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        valid: false,
        error: 'File type not allowed for security reasons'
      };
    }

    return { valid: true };
  }

  static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  static isRateLimited(identifier: string, config: SecurityConfig['validation']['rateLimiting']): boolean {
    if (typeof localStorage === 'undefined') return false;

    const key = `rate_limit_${identifier}`;
    const now = Date.now();
    const requests = JSON.parse(localStorage.getItem(key) || '[]');

    // Clean old requests
    const validRequests = requests.filter((timestamp: number) => 
      now - timestamp < config.windowMs
    );

    // Check if limit exceeded
    if (validRequests.length >= config.maxRequests) {
      return true;
    }

    // Add current request
    validRequests.push(now);
    localStorage.setItem(key, JSON.stringify(validRequests));

    return false;
  }

  static logSecurityEvent(event: {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }): void {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };

    console.warn(`🚨 Security Event [${event.severity.toUpperCase()}]:`, logEntry);

    // In production, you would send this to a security monitoring service
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-event', {
        detail: logEntry
      }));
    }
  }
}

// Export security configuration for use in components
export { defaultSecurityConfig as securityConfig };
export default SecurityUtils;