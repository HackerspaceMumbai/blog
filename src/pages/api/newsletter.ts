// Secure newsletter subscription API endpoint
import type { APIRoute } from 'astro';
import { createSecurityMiddleware } from '../../middleware/security';
import { SecurityUtils } from '../../utils/security-config';

export const POST: APIRoute = async (context) => {
  const securityMiddleware = createSecurityMiddleware({
    enableCSRF: true,
    enableRateLimit: true,
    enableInputValidation: true,
    enableLogging: true,
    customValidation: async (ctx) => {
      // Custom validation for newsletter subscription
      const formData = await ctx.request.clone().formData();
      const email = formData.get('email') as string;
      
      // Validate email format
      if (!email || !SecurityUtils.validateEmail(email)) {
        return false;
      }
      
      // Check for disposable email domains (basic check)
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (disposableDomains.includes(emailDomain)) {
        SecurityUtils.logSecurityEvent({
          type: 'disposable_email_attempt',
          message: `Disposable email domain detected: ${emailDomain}`,
          severity: 'low',
          metadata: { email, domain: emailDomain }
        });
        return false;
      }
      
      return true;
    }
  });

  return securityMiddleware(context, async () => {
    try {
      const formData = await context.request.formData();
      
      // Extract and validate form data
      const email = formData.get('email') as string;
      const name = formData.get('name') as string || '';
      const preferences = formData.getAll('preferences') as string[];
      
      // Additional server-side validation
      if (!email || !SecurityUtils.validateEmail(email)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid email address'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Sanitize inputs
      const sanitizedEmail = email.toLowerCase().trim();
      const sanitizedName = SecurityUtils.sanitizeHTML(name.trim());
      const sanitizedPreferences = preferences.map(pref => 
        SecurityUtils.sanitizeHTML(pref.trim())
      );
      
      // Check for honeypot
      const honeypot = formData.get('website') as string;
      if (honeypot && honeypot.trim() !== '') {
        SecurityUtils.logSecurityEvent({
          type: 'honeypot_triggered',
          message: 'Newsletter form honeypot triggered',
          severity: 'medium',
          metadata: { email: sanitizedEmail, honeypot }
        });
        
        // Return success to not alert the bot
        return new Response(JSON.stringify({
          success: true,
          message: 'Subscription successful'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Simulate newsletter subscription (replace with actual service)
      const subscriptionResult = await subscribeToNewsletter({
        email: sanitizedEmail,
        name: sanitizedName,
        preferences: sanitizedPreferences,
        timestamp: new Date().toISOString(),
        source: 'website',
        ipAddress: getClientIP(context.request),
        userAgent: context.request.headers.get('user-agent') || ''
      });
      
      if (subscriptionResult.success) {
        // Log successful subscription
        SecurityUtils.logSecurityEvent({
          type: 'newsletter_subscription',
          message: 'Newsletter subscription successful',
          severity: 'low',
          metadata: { 
            email: sanitizedEmail, 
            preferences: sanitizedPreferences.length 
          }
        });
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Successfully subscribed to newsletter'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: subscriptionResult.error || 'Subscription failed'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
    } catch (error) {
      SecurityUtils.logSecurityEvent({
        type: 'newsletter_api_error',
        message: `Newsletter API error: ${error}`,
        severity: 'high',
        metadata: { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
};

// Newsletter subscription interface
interface NewsletterSubscription {
  email: string;
  name: string;
  preferences: string[];
  timestamp: string;
  source: string;
  ipAddress: string;
  userAgent: string;
}

// Mock newsletter subscription function
async function subscribeToNewsletter(subscription: NewsletterSubscription): Promise<{
  success: boolean;
  error?: string;
}> {
  // In a real implementation, this would integrate with your email service
  // (Mailchimp, ConvertKit, SendGrid, etc.)
  
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated service error');
    }
    
    // Log subscription (in production, save to database)
    console.log('Newsletter subscription:', {
      email: subscription.email,
      name: subscription.name,
      preferences: subscription.preferences,
      timestamp: subscription.timestamp
    });
    
    // In production, you would:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Add to email service provider
    // 4. Set up automation sequences
    
    return { success: true };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper function to get client IP
function getClientIP(request: Request): string {
  const headers = request.headers;
  
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         headers.get('x-real-ip') ||
         headers.get('cf-connecting-ip') ||
         headers.get('x-client-ip') ||
         'unknown';
}

// Handle other HTTP methods
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    error: 'Method not allowed'
  }), {
    status: 405,
    headers: { 
      'Content-Type': 'application/json',
      'Allow': 'POST'
    }
  });
};

export const PUT: APIRoute = GET;
export const DELETE: APIRoute = GET;
export const PATCH: APIRoute = GET;