// API utility functions for newsletter integration

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface NewsletterSubscriptionData {
  subscriptionId: number;
  email: string;
  state: 'active' | 'inactive';
}

// Client-side API call helper
export async function subscribeToNewsletter(email: string): Promise<ApiResponse<NewsletterSubscriptionData>> {
  try {
    const response = await fetch('/.netlify/functions/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data: ApiResponse<NewsletterSubscriptionData> = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Subscription failed');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
}

// Email validation utility (client-side)
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim();

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  return { isValid: true };
}

// Rate limiting helper for client-side
export class ClientRateLimit {
  private attempts: number = 0;
  private resetTime: number = 0;
  private readonly maxAttempts: number = 5;
  private readonly windowMs: number = 60 * 1000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    
    if (now > this.resetTime) {
      this.attempts = 0;
      this.resetTime = now + this.windowMs;
    }

    if (this.attempts >= this.maxAttempts) {
      return false;
    }

    this.attempts++;
    return true;
  }

  getTimeUntilReset(): number {
    return Math.max(0, this.resetTime - Date.now());
  }
}