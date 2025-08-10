import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Types for our newsletter API
interface NewsletterSubscription {
  email: string;
  source: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface APIResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface KitSubscriber {
  email: string;
  first_name?: string;
  fields?: Record<string, string>;
  tags?: string[];
}

interface KitResponse {
  subscription?: {
    id: number;
    state: string;
    created_at: string;
    source: string;
    referrer: string;
    subscribable_id: number;
    subscribable_type: string;
    subscriber: {
      id: number;
      first_name: string;
      email_address: string;
      state: string;
      created_at: string;
    };
  };
  error?: string;
  message?: string;
}

// Rate limiting in-memory store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

// Constants
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enhanced validation constants
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;
const MIN_EMAIL_LENGTH = 5;
const SUSPICIOUS_PATTERNS = [
  /script/i,
  /<[^>]*>/,
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /onload/i,
  /onerror/i,
  /onclick/i
];

// Blocked domains (common spam/temporary email providers)
const BLOCKED_DOMAINS = [
  '10minutemail.com',
  'tempmail.org',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'getnada.com'
];

// Environment variables with validation (read at runtime for better testability)
const getKitApiKey = () => process.env.KIT_API_KEY;
const getKitFormId = () => process.env.KIT_FORM_ID;
const KIT_API_URL = process.env.KIT_API_URL || 'https://api.kit.com/v4';
const CORS_ORIGIN = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://hackmum.in' : '*');
const NODE_ENV = process.env.NODE_ENV || 'development';

// Logging configuration
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'error' : 'debug');

// Enhanced logging utility with structured logging
function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[LOG_LEVEL as keyof typeof levels] || 0;
  
  if (levels[level] >= currentLevel) {
    const timestamp = new Date().toISOString();
    
    // Structured logging for better monitoring
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: 'newsletter-api',
      version: '1.0.0',
      environment: NODE_ENV,
      ...(data && { data })
    };

    // Use structured JSON logging in production for better parsing
    if (NODE_ENV === 'production') {
      console[level](JSON.stringify(logEntry));
    } else {
      // Human-readable format for development
      const logData = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
      console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`);
    }
  }
}

// Enhanced error tracking for monitoring
function trackError(error: Error | string, context?: any) {
  const errorData = {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { message: error },
    context,
    timestamp: new Date().toISOString(),
    service: 'newsletter-api'
  };

  log('error', 'Error tracked', errorData);

  // In production, you could send to external monitoring services:
  // - Sentry
  // - LogRocket
  // - Datadog
  // - New Relic
  // Example: if (NODE_ENV === 'production') { sendToSentry(errorData); }
}

// Performance monitoring utility
function trackPerformance(operation: string, startTime: number, metadata?: any) {
  const duration = Date.now() - startTime;
  
  log('info', 'Performance metric', {
    operation,
    duration_ms: duration,
    metadata,
    timestamp: new Date().toISOString()
  });

  // Track slow operations
  if (duration > 5000) { // 5 seconds
    log('warn', 'Slow operation detected', {
      operation,
      duration_ms: duration,
      metadata
    });
  }
}

// Mock database for subscriptions (fallback when Kit is not available)
const subscriptions = new Set<string>();

// Export for testing (conditionally populated)
const __testing__ = process.env.NODE_ENV === 'test' ? {
  clearRateLimitStore: () => rateLimitStore.clear(),
  clearSubscriptions: () => subscriptions.clear()
} : undefined;

export { __testing__ };

/**
 * Sanitizes input string by removing potentially harmful content
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Limit length to prevent DoS
}

/**
 * Validates email address format and requirements with enhanced security
 */
function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  // Sanitize input first
  const sanitizedEmail = sanitizeInput(email).toLowerCase();

  if (!sanitizedEmail) {
    return { isValid: false, error: 'Email is required' };
  }

  // Length validation
  if (sanitizedEmail.length < MIN_EMAIL_LENGTH) {
    return { isValid: false, error: 'Email address is too short' };
  }

  if (sanitizedEmail.length > MAX_EMAIL_LENGTH) {
    return { isValid: false, error: 'Email address is too long' };
  }

  // Format validation
  if (!EMAIL_REGEX.test(sanitizedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Enhanced security checks
  if (sanitizedEmail.includes('..') || 
      sanitizedEmail.startsWith('.') || 
      sanitizedEmail.endsWith('.') ||
      sanitizedEmail.includes('..@') ||
      sanitizedEmail.includes('@.')) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for suspicious patterns (XSS, injection attempts)
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitizedEmail)) {
      log('warn', 'Suspicious email pattern detected', { 
        email: sanitizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        pattern: pattern.toString()
      });
      return { isValid: false, error: 'Please enter a valid email address' };
    }
  }

  // Check against blocked domains
  const domain = sanitizedEmail.split('@')[1];
  if (domain && BLOCKED_DOMAINS.includes(domain.toLowerCase())) {
    log('warn', 'Blocked domain detected', { 
      domain: domain,
      email: sanitizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2')
    });
    return { isValid: false, error: 'Temporary email addresses are not allowed. Please use a permanent email address.' };
  }

  // Additional domain validation
  if (domain) {
    // Check for valid TLD (at least 2 characters)
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    // Check for suspicious domain patterns
    if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
  }

  return { isValid: true };
}

/**
 * Validates first name input with enhanced security
 */
function validateFirstName(firstName: string): ValidationResult {
  if (!firstName) {
    return { isValid: true }; // First name is optional
  }

  if (typeof firstName !== 'string') {
    return { isValid: false, error: 'Invalid name format' };
  }

  // Sanitize input
  const sanitizedName = sanitizeInput(firstName);

  // Length validation
  if (sanitizedName.length > MAX_NAME_LENGTH) {
    return { isValid: false, error: 'Name is too long' };
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitizedName)) {
      log('warn', 'Suspicious name pattern detected', { 
        name: sanitizedName.substring(0, 10) + '...',
        pattern: pattern.toString()
      });
      return { isValid: false, error: 'Invalid characters in name' };
    }
  }

  // Basic name validation (letters, spaces, hyphens, apostrophes, and numbers)
  const nameRegex = /^[a-zA-Z0-9\s\-'\.]+$/;
  if (!nameRegex.test(sanitizedName)) {
    log('warn', 'Name validation failed', { 
      name: sanitizedName.substring(0, 10) + '...',
      regex: nameRegex.toString()
    });
    return { isValid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
}

/**
 * Implements rate limiting based on IP address
 */
function checkRateLimit(ipAddress: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const key = `rate_limit_${ipAddress}`;
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset or create new rate limit entry
    rateLimitStore.set(key, {
      attempts: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }

  if (existing.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
    const remainingTime = Math.ceil((existing.resetTime - now) / 1000 / 60);
    return {
      allowed: false,
      error: `Too many attempts. Please try again in ${remainingTime} minutes.`
    };
  }

  // Increment attempts
  existing.attempts += 1;
  rateLimitStore.set(key, existing);
  return { allowed: true };
}

/**
 * Checks if email is already subscribed (fallback method)
 */
function isAlreadySubscribed(email: string): boolean {
  return subscriptions.has(email.toLowerCase().trim());
}

/**
 * Adds email to subscription list (fallback method)
 */
function addSubscription(email: string): boolean {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    subscriptions.add(normalizedEmail);
    
    log('info', 'New subscription added to fallback storage', { email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2') });
    
    return true;
  } catch (error) {
    log('error', 'Error adding subscription', { error: error instanceof Error ? error.message : error });
    return false;
  }
}

/**
 * Maps Kit API errors to user-friendly messages
 */
function mapKitErrorToUserMessage(status: number, errorData: any): string {
  switch (status) {
    case 400:
      if (errorData.message?.includes('email')) {
        return 'Please enter a valid email address';
      }
      return 'Invalid subscription request. Please check your information and try again.';
    
    case 401:
      return 'Newsletter service is temporarily unavailable. Please try again later.';
    
    case 403:
      return 'Subscription request was blocked. Please contact support if this continues.';
    
    case 409:
    case 422:
      if (errorData.message?.includes('already subscribed') || 
          errorData.message?.includes('duplicate') ||
          errorData.errors?.email?.includes('taken')) {
        return 'This email is already subscribed to our newsletter';
      }
      if (errorData.message?.includes('invalid email')) {
        return 'Please enter a valid email address';
      }
      return 'Unable to process subscription. Please check your email address and try again.';
    
    case 429:
      return 'Too many subscription attempts. Please wait a few minutes before trying again.';
    
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Newsletter service is temporarily unavailable. Please try again in a few minutes.';
    
    default:
      return 'Unable to complete subscription. Please try again later.';
  }
}

/**
 * Adds subscription to Kit (ConvertKit) with enhanced error handling
 */
async function subscribeToKit(email: string, firstName: string, source: string): Promise<{ success: boolean; error?: string; data?: any }> {
  const KIT_API_KEY = getKitApiKey();
  const KIT_FORM_ID = getKitFormId();
  
  if (!KIT_API_KEY || !KIT_FORM_ID) {
    log('warn', 'Kit credentials not configured, using fallback storage');
    return { success: addSubscription(email), error: !addSubscription(email) ? 'Failed to add subscription' : undefined };
  }

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use Kit's v4 subscribers API (correct format)
      const apiUrl = `${KIT_API_URL}/subscribers`;
      log('debug', 'Making Kit API request (v4 subscribers)', { 
        url: apiUrl, 
        hasApiKey: !!KIT_API_KEY,
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        attempt
      });

      // Create subscriber data for v4 API
      const subscriberData = {
        email_address: email.toLowerCase().trim(),
        first_name: firstName || '',
        tags: ['website-signup'],
        fields: {
          source: source,
          signup_date: new Date().toISOString(),
          ip_address: 'server-side', // Don't expose client IP to Kit
          user_agent: 'Hackerspace Mumbai Newsletter/1.0'
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Kit-Api-Key': KIT_API_KEY,
          'User-Agent': 'Hackerspace Mumbai Newsletter/1.0',
          'Accept': 'application/json'
        },
        body: JSON.stringify(subscriberData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        // Log detailed error for debugging
        log('error', 'Kit API error', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorData,
          url: apiUrl,
          attempt,
          headers: response.headers ? Object.fromEntries(response.headers.entries()) : {}
        });

        // Don't retry on client errors (4xx), only server errors (5xx)
        if (response.status >= 400 && response.status < 500) {
          const userMessage = mapKitErrorToUserMessage(response.status, errorData);
          return { success: false, error: userMessage };
        }

        // For server errors, retry if we have attempts left
        if (attempt < maxRetries && response.status >= 500) {
          lastError = { status: response.status, data: errorData };
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          log('info', `Retrying Kit API request in ${delay}ms`, { attempt, maxRetries });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Final attempt failed
        const userMessage = mapKitErrorToUserMessage(response.status, errorData);
        return { success: false, error: userMessage };
      }

      const kitResponse: KitResponse = await response.json();
      
      log('info', 'Successfully subscribed to Kit', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        subscriberId: kitResponse.subscription?.subscriber?.id,
        state: kitResponse.subscription?.state,
        attempt
      });

      return { 
        success: true, 
        data: {
          subscriberId: kitResponse.subscription?.subscriber?.id,
          state: kitResponse.subscription?.state,
          source: source
        }
      };

    } catch (error) {
      lastError = error;
      
      if (error instanceof Error && error.name === 'AbortError') {
        log('error', 'Kit API request timeout', { attempt, email: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        return { success: false, error: 'Request timeout. Please try again.' };
      }

      log('error', 'Error subscribing to Kit', { 
        error: error instanceof Error ? error.message : error,
        attempt,
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
      });

      // Retry on network errors
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All attempts failed, use fallback
  log('warn', 'All Kit API attempts failed, using fallback storage', { 
    lastError: lastError instanceof Error ? lastError.message : lastError,
    email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
  });
  
  const fallbackSuccess = addSubscription(email);
  return { 
    success: fallbackSuccess, 
    error: !fallbackSuccess ? 'Unable to complete subscription. Please try again later.' : undefined 
  };
}

/**
 * Checks if email is already subscribed (Kit API or fallback)
 */
async function checkExistingSubscription(email: string): Promise<boolean> {
  const KIT_API_KEY = getKitApiKey();
  
  if (!KIT_API_KEY) {
    return isAlreadySubscribed(email);
  }

  try {
    // Check Kit API for existing subscription
    const response = await fetch(`${KIT_API_URL}/subscribers?email_address=${encodeURIComponent(email)}`, {
      headers: {
        'X-Kit-Api-Key': KIT_API_KEY,
        'User-Agent': 'Hackerspace Mumbai Newsletter/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.subscribers && data.subscribers.length > 0;
    }
  } catch (error) {
    log('error', 'Error checking Kit subscription', { error: error instanceof Error ? error.message : error });
  }

  // Fallback to local check
  return isAlreadySubscribed(email);
}

/**
 * Sends confirmation email (mock implementation)
 */
async function sendConfirmationEmail(email: string): Promise<boolean> {
  try {
    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    log('debug', 'Sending confirmation email', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2') });
    
    // Mock delay to simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    log('error', 'Error sending confirmation email', { error: error instanceof Error ? error.message : error });
    return false;
  }
}

/**
 * Logs subscription event for analytics
 */
function logSubscriptionEvent(subscription: NewsletterSubscription): void {
  try {
    // Enhanced logging with privacy protection
    log('info', 'Newsletter subscription event', {
      email: subscription.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially obscure email for privacy
      source: subscription.source,
      timestamp: subscription.timestamp,
      ipAddress: subscription.ipAddress?.replace(/\.\d+$/, '.***'), // Partially obscure IP
      userAgent: subscription.userAgent ? subscription.userAgent.substring(0, 50) + '...' : undefined
    });
    
    // In production, you might want to send to analytics services like:
    // - Google Analytics 4
    // - Mixpanel
    // - PostHog
    // - Custom analytics endpoint
    
  } catch (error) {
    log('error', 'Error logging subscription event', { error: error instanceof Error ? error.message : error });
  }
}

/**
 * Main handler for newsletter API with enhanced monitoring
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const startTime = Date.now();
  const requestId = context.awsRequestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://hackmum.in' 
      : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'X-Request-ID': requestId
  };

  // Log incoming request
  log('info', 'Newsletter API request received', {
    requestId,
    method: event.httpMethod,
    path: event.path,
    userAgent: event.headers['user-agent']?.substring(0, 100),
    origin: event.headers.origin,
    referer: event.headers.referer
  });

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST.'
        } as APIResponse)
      };
    }

    // Get client IP address
    const ipAddress = event.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     event.headers['x-real-ip'] || 
                     context.ip || 
                     'unknown';

    // Check rate limiting
    const rateLimitCheck = checkRateLimit(ipAddress);
    if (!rateLimitCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '900' // 15 minutes
        },
        body: JSON.stringify({
          success: false,
          error: rateLimitCheck.error
        } as APIResponse)
      };
    }

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
      log('debug', 'Request data parsed', { 
        requestId,
        hasEmail: !!requestData.email,
        hasFirstName: !!requestData.firstName,
        source: requestData.source
      });
    } catch (parseError) {
      log('error', 'JSON parse error', { requestId, body: event.body, error: parseError });
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          requestId
        } as APIResponse)
      };
    }

    // Validate required fields and sanitize inputs
    const { email, firstName = '', source = 'website_newsletter', timestamp } = requestData;

    if (!email) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Email is required'
        } as APIResponse)
      };
    }

    // Validate email format with enhanced security
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      log('warn', 'Email validation failed', { 
        email: email.substring(0, 5) + '***',
        error: emailValidation.error,
        ipAddress: ipAddress.replace(/\.\d+$/, '.***')
      });
      
      return {
        statusCode: 422,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: emailValidation.error
        } as APIResponse)
      };
    }

    // Validate first name if provided
    const firstNameValidation = validateFirstName(firstName);
    if (!firstNameValidation.isValid) {
      log('warn', 'First name validation failed', { 
        requestId,
        firstName: firstName.substring(0, 5) + '***',
        error: firstNameValidation.error,
        ipAddress: ipAddress.replace(/\.\d+$/, '.***')
      });
      
      return {
        statusCode: 422,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: firstNameValidation.error
        } as APIResponse)
      };
    }

    // Sanitize and normalize inputs
    const normalizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedFirstName = sanitizeInput(firstName);
    let sanitizedSource = sanitizeInput(source) || 'website_newsletter';

    // Additional validation for source parameter
    const allowedSources = ['website_newsletter', 'blog_signup', 'event_signup', 'footer_signup'];
    if (!allowedSources.includes(sanitizedSource)) {
      log('warn', 'Invalid source parameter', { 
        source: sanitizedSource,
        ipAddress: ipAddress.replace(/\.\d+$/, '.***')
      });
      // Don't reject, just use default
      sanitizedSource = 'website_newsletter';
    }

    // Check if already subscribed
    const alreadySubscribed = await checkExistingSubscription(normalizedEmail);
    if (alreadySubscribed) {
      return {
        statusCode: 409,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'This email is already subscribed to our newsletter'
        } as APIResponse)
      };
    }

    // Create subscription object
    const subscription: NewsletterSubscription = {
      email: normalizedEmail,
      source,
      timestamp: timestamp || new Date().toISOString(),
      ipAddress,
      userAgent: event.headers['user-agent']
    };

    // Subscribe to Kit (or fallback storage)
    const subscriptionResult = await subscribeToKit(normalizedEmail, sanitizedFirstName, sanitizedSource);
    if (!subscriptionResult.success) {
      // Determine appropriate status code based on error type
      let statusCode = 500;
      const errorMessage = subscriptionResult.error || 'Failed to process subscription. Please try again.';
      
      if (errorMessage.includes('already subscribed')) {
        statusCode = 409;
      } else if (errorMessage.includes('valid email') || errorMessage.includes('invalid')) {
        statusCode = 422;
      } else if (errorMessage.includes('too many') || errorMessage.includes('rate limit')) {
        statusCode = 429;
      } else if (errorMessage.includes('temporarily unavailable') || errorMessage.includes('timeout')) {
        statusCode = 503;
      }

      log('info', 'Subscription failed', {
        email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: errorMessage,
        statusCode,
        ipAddress: ipAddress.replace(/\.\d+$/, '.***')
      });

      return {
        statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...(statusCode === 429 ? { 'Retry-After': '900' } : {}), // 15 minutes for rate limiting
          ...(statusCode === 503 ? { 'Retry-After': '300' } : {})  // 5 minutes for service unavailable
        },
        body: JSON.stringify({
          success: false,
          error: errorMessage
        } as APIResponse)
      };
    }

    // Send confirmation email
    const emailSent = await sendConfirmationEmail(normalizedEmail);
    if (!emailSent) {
      console.error('Failed to send confirmation email, but subscription was added');
    }

    // Log the event
    logSubscriptionEvent(subscription);

    // Track successful subscription
    trackPerformance('newsletter_subscription_success', startTime, {
      requestId,
      email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
      source: sanitizedSource,
      hasFirstName: !!sanitizedFirstName
    });

    log('info', 'Newsletter subscription completed successfully', {
      requestId,
      email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
      source: sanitizedSource,
      duration_ms: Date.now() - startTime
    });

    // Return success response
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Successfully subscribed to newsletter! Please check your email to confirm your subscription.',
        data: {
          email: normalizedEmail,
          firstName: sanitizedFirstName,
          timestamp: subscription.timestamp,
          source: sanitizedSource
        }
      } as APIResponse)
    };

  } catch (error) {
    // Track error with full context
    trackError(error instanceof Error ? error : new Error(String(error)), {
      requestId,
      method: event.httpMethod,
      path: event.path,
      userAgent: event.headers['user-agent']?.substring(0, 100),
      duration_ms: Date.now() - startTime
    });

    trackPerformance('newsletter_subscription_error', startTime, {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error. Please try again later.',
        requestId // Include request ID for support purposes
      } as APIResponse)
    };
  }
};
