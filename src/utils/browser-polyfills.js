/**
 * Browser Polyfills and Cross-Browser Compatibility Fixes
 * 
 * This module provides polyfills and fixes for cross-browser compatibility,
 * especially focusing on mobile browsers and older versions.
 */

// Polyfill for browsers that don't support CSS.supports
if (!window.CSS || !window.CSS.supports) {
  window.CSS = window.CSS || {};
  window.CSS.supports = function(property, value) {
    // Basic fallback - create test element
    const element = document.createElement('div');
    try {
      element.style[property] = value;
      return element.style[property] === value;
    } catch (e) {
      return false;
    }
  };
}

// Polyfill for IntersectionObserver (for older browsers)
if (!window.IntersectionObserver) {
  // Simple fallback that immediately triggers callback
  window.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options = {}) {
      this.callback = callback;
      this.options = options;
      this.elements = new Set();
    }
    
    observe(element) {
      this.elements.add(element);
      // Immediately trigger callback for fallback
      setTimeout(() => {
        this.callback([{
          target: element,
          isIntersecting: true,
          intersectionRatio: 1
        }], this);
      }, 100);
    }
    
    unobserve(element) {
      this.elements.delete(element);
    }
    
    disconnect() {
      this.elements.clear();
    }
  };
}

// Polyfill for requestAnimationFrame
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 1000 / 60);
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

// Polyfill for matchMedia (for older browsers)
if (!window.matchMedia) {
  window.matchMedia = function(query) {
    return {
      matches: false,
      media: query,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {}
    };
  };
}

// Polyfill for closest() method
if (!Element.prototype.closest) {
  Element.prototype.closest = function(selector) {
    let element = this;
    while (element && element.nodeType === 1) {
      if (element.matches(selector)) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  };
}

// Polyfill for matches() method
if (!Element.prototype.matches) {
  Element.prototype.matches = 
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function(selector) {
      const matches = (this.document || this.ownerDocument).querySelectorAll(selector);
      let i = matches.length;
      while (--i >= 0 && matches.item(i) !== this) {}
      return i > -1;
    };
}

// Polyfill for Object.assign
if (!Object.assign) {
  Object.assign = function(target, ...sources) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    
    const to = Object(target);
    
    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index];
      
      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    
    return to;
  };
}

// Polyfill for Array.from
if (!Array.from) {
  Array.from = function(arrayLike, mapFn, thisArg) {
    const C = this;
    const items = Object(arrayLike);
    
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object - not null or undefined');
    }
    
    const mapFunction = mapFn === undefined ? undefined : mapFn;
    if (typeof mapFunction !== 'undefined' && typeof mapFunction !== 'function') {
      throw new TypeError('Array.from: when provided, the second argument must be a function');
    }
    
    const len = parseInt(items.length);
    const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
    
    let k = 0;
    while (k < len) {
      const kValue = items[k];
      const mappedValue = mapFunction ? mapFunction.call(thisArg, kValue, k) : kValue;
      A[k] = mappedValue;
      k += 1;
    }
    
    A.length = len;
    return A;
  };
}

// Polyfill for Promise (basic implementation)
if (!window.Promise) {
  window.Promise = function(executor) {
    const self = this;
    self.state = 'pending';
    self.value = undefined;
    self.handlers = [];
    
    function resolve(result) {
      if (self.state === 'pending') {
        self.state = 'fulfilled';
        self.value = result;
        self.handlers.forEach(handle);
        self.handlers = null;
      }
    }
    
    function reject(error) {
      if (self.state === 'pending') {
        self.state = 'rejected';
        self.value = error;
        self.handlers.forEach(handle);
        self.handlers = null;
      }
    }
    
    function handle(handler) {
      if (self.state === 'pending') {
        self.handlers.push(handler);
      } else {
        if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
          handler.onFulfilled(self.value);
        }
        if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
          handler.onRejected(self.value);
        }
      }
    }
    
    this.then = function(onFulfilled, onRejected) {
      return new Promise(function(resolve, reject) {
        handle({
          onFulfilled: function(result) {
            try {
              const returnValue = onFulfilled ? onFulfilled(result) : result;
              resolve(returnValue);
            } catch (ex) {
              reject(ex);
            }
          },
          onRejected: function(error) {
            try {
              const returnValue = onRejected ? onRejected(error) : error;
              reject(returnValue);
            } catch (ex) {
              reject(ex);
            }
          }
        });
      });
    };
    
    this.catch = function(onRejected) {
      return this.then(null, onRejected);
    };
    
    executor(resolve, reject);
  };
  
  Promise.resolve = function(value) {
    return new Promise(function(resolve) {
      resolve(value);
    });
  };
  
  Promise.reject = function(reason) {
    return new Promise(function(resolve, reject) {
      reject(reason);
    });
  };
}

// Polyfill for fetch API (basic implementation)
if (!window.fetch) {
  window.fetch = function(url, options = {}) {
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      const method = options.method || 'GET';
      
      xhr.open(method, url);
      
      // Set headers
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      xhr.onload = function() {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          text: function() {
            return Promise.resolve(xhr.responseText);
          },
          json: function() {
            return Promise.resolve(JSON.parse(xhr.responseText));
          }
        };
        resolve(response);
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error'));
      };
      
      xhr.send(options.body);
    });
  };
}

// Browser-specific fixes
const BrowserFixes = {
  // Fix for iOS Safari viewport height issue
  fixIOSViewportHeight() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Fix for iOS Safari's viewport height issue
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);
      window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 500);
      });
    }
  },
  
  // Fix for Android Chrome address bar height issue
  fixAndroidViewport() {
    if (/Android/.test(navigator.userAgent)) {
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);
    }
  },
  
  // Fix for 300ms click delay on mobile
  fixClickDelay() {
    if ('ontouchstart' in window) {
      // Add meta tag to disable 300ms delay
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport && !viewport.content.includes('user-scalable=no')) {
        // Add touch-action: manipulation to body
        document.body.style.touchAction = 'manipulation';
      }
    }
  },
  
  // Fix for sticky positioning in older browsers
  fixStickyPositioning() {
    if (!CSS.supports('position', 'sticky')) {
      // Add polyfill class for sticky elements
      const stickyElements = document.querySelectorAll('[data-sticky]');
      stickyElements.forEach(element => {
        element.classList.add('sticky-polyfill');
      });
    }
  },
  
  // Fix for flexbox issues in older browsers
  fixFlexboxIssues() {
    if (!CSS.supports('display', 'flex')) {
      // Add fallback classes
      const flexElements = document.querySelectorAll('.flex, [class*="flex-"]');
      flexElements.forEach(element => {
        element.classList.add('flexbox-fallback');
      });
    }
  },
  
  // Fix for CSS Grid issues in older browsers
  fixGridIssues() {
    if (!CSS.supports('display', 'grid')) {
      // Add fallback classes
      const gridElements = document.querySelectorAll('.grid, [class*="grid-"]');
      gridElements.forEach(element => {
        element.classList.add('grid-fallback');
      });
    }
  },
  
  // Fix for transform issues in older browsers
  fixTransformIssues() {
    const testElement = document.createElement('div');
    const prefixes = ['transform', '-webkit-transform', '-moz-transform', '-ms-transform'];
    let transformSupported = false;
    
    prefixes.forEach(prefix => {
      if (prefix in testElement.style) {
        transformSupported = true;
      }
    });
    
    if (!transformSupported) {
      document.documentElement.classList.add('no-transforms');
    }
  },
  
  // Fix for custom properties (CSS variables) in older browsers
  fixCustomProperties() {
    if (!CSS.supports('color', 'var(--test)')) {
      // Add fallback class
      document.documentElement.classList.add('no-css-variables');
    }
  },
  
  // Apply all fixes
  applyAll() {
    this.fixIOSViewportHeight();
    this.fixAndroidViewport();
    this.fixClickDelay();
    this.fixStickyPositioning();
    this.fixFlexboxIssues();
    this.fixGridIssues();
    this.fixTransformIssues();
    this.fixCustomProperties();
  }
};

// Auto-apply fixes when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BrowserFixes.applyAll());
} else {
  BrowserFixes.applyAll();
}

// Export for manual use
window.BrowserFixes = BrowserFixes;

// Feature detection utilities
window.FeatureDetection = {
  // Check if browser supports a CSS feature
  supportsCSS(property, value) {
    return CSS.supports(property, value);
  },
  
  // Check if browser supports a JavaScript API
  supportsAPI(api) {
    return typeof window[api] !== 'undefined';
  },
  
  // Get browser information
  getBrowserInfo() {
    const ua = navigator.userAgent;
    return {
      isChrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
      isSafari: /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor),
      isFirefox: /Firefox/.test(ua),
      isEdge: /Edg/.test(ua),
      isIE: /Trident/.test(ua),
      isMobile: /Mobi|Android/i.test(ua),
      isIOS: /iPad|iPhone|iPod/.test(ua),
      isAndroid: /Android/.test(ua)
    };
  },
  
  // Check for touch support
  hasTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Check for hover support
  hasHover() {
    return window.matchMedia('(hover: hover)').matches;
  },
  
  // Check for reduced motion preference
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Check for dark mode preference
  prefersDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
};

console.log('🔧 Browser polyfills and fixes loaded');
console.log('📱 Browser info:', window.FeatureDetection.getBrowserInfo());