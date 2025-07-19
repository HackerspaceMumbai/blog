import type { FormField, FormValidation } from '../components/types';

// =============================================================================
// DATA VALIDATION UTILITIES
// =============================================================================

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Sanitizes HTML content to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validates form field based on validation rules
 */
export function validateField(value: string, validation: FormValidation): string | null {
  if (!validation) return null;
  
  // Required validation
  if (validation.required && (!value || value.trim().length === 0)) {
    return 'This field is required';
  }
  
  // Skip other validations if field is empty and not required
  if (!value || value.trim().length === 0) {
    return null;
  }
  
  // Min length validation
  if (validation.minLength && value.length < validation.minLength) {
    return `Must be at least ${validation.minLength} characters`;
  }
  
  // Max length validation
  if (validation.maxLength && value.length > validation.maxLength) {
    return `Must be no more than ${validation.maxLength} characters`;
  }
  
  // Pattern validation
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return 'Invalid format';
    }
  }
  
  // Custom validator
  if (validation.validator) {
    return validation.validator(value);
  }
  
  return null;
}

/**
 * Validates multiple form fields
 */
export function validateForm(fields: FormField[], values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  fields.forEach(field => {
    if (field.validation) {
      const value = values[field.name] || '';
      const error = validateField(value, field.validation);
      if (error) {
        errors[field.name] = error;
      }
    }
  });
  
  return errors;
}

// =============================================================================
// DATA TYPE VALIDATION
// =============================================================================

/**
 * Type guard for checking if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for checking if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for checking if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for checking if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard for checking if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// =============================================================================
// CONTENT VALIDATION
// =============================================================================

/**
 * Validates blog post data
 */
export function validateBlogPost(post: any): boolean {
  if (!isObject(post)) return false;
  
  const requiredFields = ['slug', 'title', 'description', 'date', 'author'];
  return requiredFields.every(field => 
    field in post && isString(post[field]) && post[field].trim().length > 0
  );
}

/**
 * Validates event data
 */
export function validateEvent(event: any): boolean {
  if (!isObject(event)) return false;
  
  const requiredFields = ['id', 'title', 'date', 'location', 'description', 'status'];
  return requiredFields.every(field => {
    if (field === 'location') {
      return isObject(event[field]) && isString(event[field].name);
    }
    return field in event && isString(event[field]) && event[field].trim().length > 0;
  });
}

/**
 * Validates sponsor data
 */
export function validateSponsor(sponsor: any): boolean {
  if (!isObject(sponsor)) return false;
  
  return 'name' in sponsor && isString(sponsor.name) && sponsor.name.trim().length > 0;
}

/**
 * Validates gallery image data
 */
export function validateGalleryImage(image: any): boolean {
  if (!isObject(image)) return false;
  
  const requiredFields = ['src', 'alt', 'thumbnail'];
  return requiredFields.every(field => 
    field in image && isString(image[field]) && image[field].trim().length > 0
  );
}

// =============================================================================
// ARRAY VALIDATION UTILITIES
// =============================================================================

/**
 * Validates and filters an array of items
 */
export function validateAndFilterArray<T>(
  items: unknown[],
  validator: (item: unknown) => item is T,
  maxItems?: number
): T[] {
  if (!isArray(items)) {
    console.warn('Expected array but received:', typeof items);
    return [];
  }
  
  const validItems = items.filter(validator);
  
  if (maxItems && validItems.length > maxItems) {
    console.warn(`Array truncated from ${validItems.length} to ${maxItems} items`);
    return validItems.slice(0, maxItems);
  }
  
  return validItems;
}

/**
 * Safely processes an array with error handling
 */
export function safeArrayProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  fallback: R[] = []
): R[] {
  try {
    if (!isArray(items)) {
      console.warn('safeArrayProcess: items is not an array');
      return fallback;
    }
    
    return items.map(processor);
  } catch (error) {
    console.error('Error processing array:', error);
    return fallback;
  }
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Creates a standardized error object
 */
export function createError(message: string, code?: string, details?: any) {
  return {
    hasError: true,
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Safely executes a function with error handling
 */
export function safeExecute<T>(
  fn: () => T,
  fallback: T,
  errorHandler?: (error: Error) => void
): T {
  try {
    return fn();
  } catch (error) {
    if (errorHandler && error instanceof Error) {
      errorHandler(error);
    } else {
      console.error('Safe execution failed:', error);
    }
    return fallback;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}