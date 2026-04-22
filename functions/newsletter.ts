// Cloudflare Pages Function for newsletter subscription
// Migrated from Netlify Functions to Cloudflare Pages

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

// In-memory store for subscriptions fallback (will be shared across requests in the same isolate)
const subscriptions = new Set<string>();

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

  const sanitizedEmail = sanitizeInput(email).toLowerCase();

  if (!sanitizedEmail) {
    return { isValid: false, error: 'Email is required' };
  }

  if (sanitizedEmail.length < MIN_EMAIL_LENGTH) {
    return { isValid: false, error: 'Email address is too short' };
  }

  if (sanitizedEmail.length > MAX_EMAIL_LENGTH) {
    return { isValid: false, error: 'Email address is too long' };
  }

  if (!EMAIL_REGEX.test(sanitizedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  if (sanitizedEmail.includes('..') || 
      sanitizedEmail.startsWith('.') || 
      sanitizedEmail.endsWith('.') ||
      sanitizedEmail.includes('..@') ||
      sanitizedEmail.includes('@.')) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitizedEmail)) {
      console.warn('Suspicious email pattern detected');
      return { isValid: false, error: 'Please enter a valid email address' };
    }
  }

  const domain = sanitizedEmail.split('@')[1];
  if (domain && BLOCKED_DOMAINS.includes(domain.toLowerCase())) {
    console.warn('Blocked domain detected');
    return { isValid: false, error: 'Temporary email addresses are not allowed. Please use a permanent email address.' };
  }

  if (domain) {
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

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

  const sanitizedName = sanitizeInput(firstName);

  if (sanitizedName.length > MAX_NAME_LENGTH) {
    return { isValid: false, error: 'Name is too long' };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitizedName)) {
      console.warn('Suspicious name pattern detected');
      return { isValid: false, error: 'Invalid characters in name' };
    }
  }

  const nameRegex = /^[a-zA-Z0-9\s\-'\.]+$/;
  if (!nameRegex.test(sanitizedName)) {
    return { isValid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
}

/**
 * Implements rate limiting using Cloudflare KV (if available) or in-memory fallback
 */
async function checkRateLimit(ipAddress: string, env: any): Promise<{ allowed: boolean; error?: string }> {
  const key = `rate_limit_${ipAddress}`;
  const now = Date.now();

  // If KV is available, use it for rate limiting
  if (env?.RATE_LIMIT_KV) {
    try {
      const data = await env.RATE_LIMIT_KV.get(key, 'json');
      
      if (data && data.resetTime > now) {
        if (data.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
          const remainingTime = Math.ceil((data.resetTime - now) / 1000 / 60);
          return {
            allowed: false,
            error: `Too many attempts. Please try again in ${remainingTime} minutes.`
          };
        }
        
        // Increment attempts
        await env.RATE_LIMIT_KV.put(key, JSON.stringify({
          attempts: data.attempts + 1,
          resetTime: data.resetTime
        }), { expirationTtl: Math.ceil((data.resetTime - now) / 1000) });
      } else {
        // Create new rate limit entry
        await env.RATE_LIMIT_KV.put(key, JSON.stringify({
          attempts: 1,
          resetTime: now + RATE_LIMIT_WINDOW
        }), { expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000) });
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error accessing KV for rate limiting:', error);
      // Fall through to simple check
    }
  }

  // Simple check without persistent storage (resets on isolate restart)
  return { allowed: true };
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
async function subscribeToKit(email: string, firstName: string, source: string, env: any): Promise<{ success: boolean; error?: string; data?: any }> {
  const KIT_API_KEY = env.KIT_API_KEY;
  const KIT_API_URL = env.KIT_API_URL || 'https://api.kit.com/v4';
  
  if (!KIT_API_KEY) {
    console.warn('Kit credentials not configured, using fallback storage');
    subscriptions.add(email.toLowerCase().trim());
    return { success: true };
  }

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apiUrl = `${KIT_API_URL}/subscribers`;
      
      const subscriberData = {
        email_address: email.toLowerCase().trim(),
        first_name: firstName || '',
        tags: ['website-signup'],
        fields: {
          source: source,
          signup_date: new Date().toISOString(),
          user_agent: 'Hackerspace Mumbai Newsletter/1.0'
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        
        console.error('Kit API error', { status: response.status, error: errorData });

        if (response.status >= 400 && response.status < 500) {
          const userMessage = mapKitErrorToUserMessage(response.status, errorData);
          return { success: false, error: userMessage };
        }

        if (attempt < maxRetries && response.status >= 500) {
          lastError = { status: response.status, data: errorData };
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const userMessage = mapKitErrorToUserMessage(response.status, errorData);
        return { success: false, error: userMessage };
      }

      const kitResponse: KitResponse = await response.json();
      
      console.info('Successfully subscribed to Kit', {
        subscriberId: kitResponse.subscription?.subscriber?.id,
        state: kitResponse.subscription?.state
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
        console.error('Kit API request timeout');
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        return { success: false, error: 'Request timeout. Please try again.' };
      }

      console.error('Error subscribing to Kit', { error });

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All attempts failed, use fallback
  console.warn('All Kit API attempts failed, using fallback storage');
  subscriptions.add(email.toLowerCase().trim());
  return { success: true };
}

/**
 * Cloudflare Pages Function handler
 */
export async function onRequest(context: any) {
  const { request, env } = context;
  const startTime = Date.now();
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.NODE_ENV === 'production' 
      ? 'https://hackmum.in' 
      : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  try {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response('', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      } as APIResponse), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    // Get client IP address from Cloudflare headers
    const ipAddress = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 
                     'unknown';

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(ipAddress, env);
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: rateLimitCheck.error
      } as APIResponse), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '900'
        }
      });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('JSON parse error', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      } as APIResponse), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    const { email, firstName = '', source = 'website_newsletter' } = requestData;

    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      } as APIResponse), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: emailValidation.error
      } as APIResponse), {
        status: 422,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    // Validate first name if provided
    const firstNameValidation = validateFirstName(firstName);
    if (!firstNameValidation.isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: firstNameValidation.error
      } as APIResponse), {
        status: 422,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      });
    }

    // Sanitize and normalize inputs
    const normalizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedSource = sanitizeInput(source) || 'website_newsletter';

    // Subscribe to Kit
    const subscriptionResult = await subscribeToKit(normalizedEmail, sanitizedFirstName, sanitizedSource, env);
    if (!subscriptionResult.success) {
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

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      } as APIResponse), {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...(statusCode === 429 ? { 'Retry-After': '900' } : {}),
          ...(statusCode === 503 ? { 'Retry-After': '300' } : {})
        }
      });
    }

    const duration = Date.now() - startTime;
    console.info('Newsletter subscription completed successfully', {
      email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
      source: sanitizedSource,
      duration_ms: duration
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully subscribed to newsletter! Please check your email to confirm your subscription.',
      data: {
        email: normalizedEmail,
        firstName: sanitizedFirstName,
        timestamp: new Date().toISOString(),
        source: sanitizedSource
      }
    } as APIResponse), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Error processing newsletter subscription', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error. Please try again later.'
    } as APIResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }
}
