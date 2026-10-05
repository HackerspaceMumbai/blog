/** Newsletter form client handler — loaded lazily when near viewport */
interface NewsletterFormState {
    email: string;
    firstName: string;
    isLoading: boolean;
    error: string | null;
    success: boolean;
    isSubmitting: boolean;
  }

  interface ValidationResult {
    isValid: boolean;
    error?: string;
  }

  interface APIResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }

  class NewsletterFormHandler {
    private form: HTMLFormElement;
    private emailInput: HTMLInputElement;
    private firstNameInput: HTMLInputElement;
    private submitButton: HTMLButtonElement;
    private submitText: HTMLElement;
    private emailError: HTMLElement;
    private successMessage: HTMLElement;
    private generalError: HTMLElement;
    private submitStatus: HTMLElement;
    private state: NewsletterFormState;

    // Rate limiting
    private lastSubmitTime: number = 0;
    private submitAttempts: number = 0;
    private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    private readonly MAX_ATTEMPTS = 3;

    // Error messages
    private readonly ERROR_MESSAGES = {
      INVALID_EMAIL: 'Please enter a valid email address',
      REQUIRED_EMAIL: 'Email address is required',
      ALREADY_SUBSCRIBED: 'This email is already subscribed to our newsletter',
      NETWORK_ERROR: 'Connection error. Please try again.',
      SERVER_ERROR: 'Something went wrong. Please try again later.',
      RATE_LIMITED: 'Too many attempts. Please wait a moment before trying again.',
      GENERIC_ERROR: 'An error occurred. Please try again.'
    };

    constructor(formElement: HTMLFormElement) {
      this.form = formElement;
      this.emailInput = formElement.querySelector('#newsletter-email') as HTMLInputElement;
      this.firstNameInput = formElement.querySelector('#newsletter-first-name') as HTMLInputElement;
      this.submitButton = formElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      this.submitText = formElement.querySelector('.submit-text') as HTMLElement;
      this.emailError = formElement.querySelector('#email-error') as HTMLElement;
      this.successMessage = formElement.querySelector('.success-message') as HTMLElement;
      this.generalError = formElement.querySelector('.general-error') as HTMLElement;
      this.submitStatus = formElement.querySelector('#submit-status') as HTMLElement;

      this.state = {
        email: '',
        firstName: '',
        isLoading: false,
        error: null,
        success: false,
        isSubmitting: false
      };

      this.init();
    }

    private init(): void {
      this.attachEventListeners();
      this.setupAccessibility();
    }

    private attachEventListeners(): void {
      // Form submission
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
      
      // Real-time email validation
      this.emailInput.addEventListener('input', this.handleEmailInput.bind(this));
      this.emailInput.addEventListener('blur', this.handleEmailBlur.bind(this));
      
      // First name input handling
      this.firstNameInput.addEventListener('input', this.handleFirstNameInput.bind(this));
      
      // Clear errors on focus
      this.emailInput.addEventListener('focus', this.clearEmailError.bind(this));
      
      // Retry button functionality
      this.form.addEventListener('click', this.handleRetryClick.bind(this));
    }

    private handleRetryClick(event: Event): void {
      const target = event.target as HTMLElement;
      if (target.matches('[data-action="retry"]')) {
        event.preventDefault();
        location.reload();
      }
    }

    private setupAccessibility(): void {
      // Ensure proper ARIA relationships
      this.emailInput.setAttribute('aria-describedby', 'email-error email-help');
      this.submitButton.setAttribute('aria-describedby', 'submit-status');
    }

    private handleEmailInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      this.state.email = target.value.trim();
      
      // Clear previous errors on input
      if (this.state.error && this.emailError.textContent) {
        this.clearEmailError();
      }
    }

    // Sanitize and validate first name: trim, escape, max 50 chars
    private sanitizeFirstName(input: string): string {
      let value = input.trim().slice(0, 50);
      // Escape <, >, &, ", ', /
      value = value.replace(/[<>&"'/]/g, (c) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
      })[c] || c);
      return value;
    }

    private handleFirstNameInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      let sanitized = this.sanitizeFirstName(target.value);
      this.state.firstName = sanitized;
      // Optionally update the input value to reflect sanitization
      if (target.value !== sanitized) {
        target.value = sanitized;
      }
    }

    private handleEmailBlur(event: Event): void {
      const target = event.target as HTMLInputElement;
      const email = target.value.trim();
      
      if (email && !this.validateEmail(email).isValid) {
        this.showEmailError(this.ERROR_MESSAGES.INVALID_EMAIL);
      }
    }

    private async handleSubmit(event: Event): Promise<void> {
      event.preventDefault();
      
      // Check rate limiting
      if (!this.checkRateLimit()) {
        this.showGeneralError(this.ERROR_MESSAGES.RATE_LIMITED);
        return;
      }

      const email = this.emailInput.value.trim();
      // Sanitize and validate first name before submit
      const firstName = this.sanitizeFirstName(this.firstNameInput.value);
      this.state.firstName = firstName;

      // Validate email
      const validation = this.validateEmail(email);
      if (!validation.isValid) {
        this.showEmailError(validation.error || this.ERROR_MESSAGES.INVALID_EMAIL);
        this.emailInput.focus();
        return;
      }
      
      // Validate first name length (already sanitized above)
      if (firstName.length > 50) {
        this.handleError('First name must be 50 characters or less.');
        this.firstNameInput.focus();
        return;
      }

      // Clear any previous messages
      this.clearMessages();

      // Set loading state
      this.setLoadingState(true);

      try {
        const response = await this.submitToAPI(email, firstName);

        if (response.success) {
          this.handleSuccess(response.message);
        } else {
          this.handleError(response.error || this.ERROR_MESSAGES.GENERIC_ERROR);
        }
      } catch (error) {
        console.error('Newsletter subscription error:', error);

        // Determine error type for better UX
        if (error instanceof TypeError && error.message.includes('fetch')) {
          this.handleError(this.ERROR_MESSAGES.NETWORK_ERROR);
        } else {
          this.handleError(this.ERROR_MESSAGES.GENERIC_ERROR);
        }
      } finally {
        this.setLoadingState(false);
      }
    }

    private validateEmail(email: string): ValidationResult {
      if (!email) {
        return { isValid: false, error: this.ERROR_MESSAGES.REQUIRED_EMAIL };
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { isValid: false, error: this.ERROR_MESSAGES.INVALID_EMAIL };
      }

      // Length validation
      if (email.length > 254) {
        return { isValid: false, error: this.ERROR_MESSAGES.INVALID_EMAIL };
      }

      return { isValid: true };
    }

    private checkRateLimit(): boolean {
      const now = Date.now();
      
      // Reset attempts if window has passed
      if (now - this.lastSubmitTime > this.RATE_LIMIT_WINDOW) {
        this.submitAttempts = 0;
      }
      
      // Check if too many attempts
      if (this.submitAttempts >= this.MAX_ATTEMPTS) {
        return false;
      }
      
      this.submitAttempts++;
      this.lastSubmitTime = now;
      return true;
    }

    private async submitToAPI(email: string, firstName: string = ''): Promise<APIResponse> {
      const response = await fetch('/.netlify/functions/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase(),
          firstName: firstName,
          source: 'website_newsletter',
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        // Handle specific HTTP status codes
        switch (response.status) {
          case 409:
            throw new Error(this.ERROR_MESSAGES.ALREADY_SUBSCRIBED);
          case 422:
            throw new Error(this.ERROR_MESSAGES.INVALID_EMAIL);
          case 429:
            throw new Error(this.ERROR_MESSAGES.RATE_LIMITED);
          case 500:
          case 502:
          case 503:
            throw new Error(this.ERROR_MESSAGES.SERVER_ERROR);
          default:
            throw new Error(this.ERROR_MESSAGES.NETWORK_ERROR);
        }
      }

      return await response.json();
    }

    private setLoadingState(isLoading: boolean): void {
      this.state.isLoading = isLoading;
      this.state.isSubmitting = isLoading;
      
      // Update button state
      this.submitButton.disabled = isLoading;
      this.submitButton.setAttribute('aria-disabled', isLoading.toString());
      
      if (isLoading) {
        this.submitButton.classList.add('loading');
        this.submitText.textContent = 'Subscribing...';
        this.announceToScreenReader('Submitting subscription...');
      } else {
        this.submitButton.classList.remove('loading');
        this.submitText.textContent = 'Subscribe';
      }
      
      // Disable form during submission
      this.emailInput.disabled = isLoading;
      this.firstNameInput.disabled = isLoading;
    }

    private handleSuccess(message?: string): void {
      this.state.success = true;
      this.state.error = null;
      
      // Personalize success message if first name was provided
      const successText = this.successMessage.querySelector('p') as HTMLElement;
      if (this.state.firstName) {
        successText.textContent = `Thanks ${this.state.firstName}! Please check your email to confirm your subscription.`;
      } else {
        successText.textContent = 'Thank you for subscribing! Please check your email to confirm your subscription.';
      }
      
      // Show success message
      this.successMessage.classList.remove('hidden');
      
      // Reset form
      this.form.reset();
      this.state.email = '';
      this.state.firstName = '';
      
      // Announce success to screen readers
      const announcement = this.state.firstName 
        ? `Thanks ${this.state.firstName}! Successfully subscribed to newsletter. Please check your email to confirm.`
        : 'Successfully subscribed to newsletter! Please check your email to confirm.';
      this.announceToScreenReader(announcement);
      
      // Focus management - move focus to success message for screen readers
      this.successMessage.setAttribute('tabindex', '-1');
      this.successMessage.focus();
      
      // Auto-hide success message after 10 seconds
      setTimeout(() => {
        this.successMessage.classList.add('hidden');
        this.successMessage.removeAttribute('tabindex');
      }, 10000);
    }

    private handleError(errorMessage: string): void {
      this.state.error = errorMessage;
      this.state.success = false;
      
      // Determine if it's a field-specific error or general error
      if (errorMessage === this.ERROR_MESSAGES.INVALID_EMAIL || 
          errorMessage === this.ERROR_MESSAGES.REQUIRED_EMAIL) {
        this.showEmailError(errorMessage);
        this.emailInput.focus();
      } else if (errorMessage === this.ERROR_MESSAGES.NETWORK_ERROR) {
        this.showNetworkError();
      } else {
        this.showGeneralError(errorMessage);
      }
    }

    private showEmailError(message: string): void {
      this.emailError.textContent = message;
      this.emailError.classList.remove('hidden');
      this.emailInput.setAttribute('aria-invalid', 'true');
      this.emailInput.classList.add('input-error');
      
      // Announce error to screen readers
      this.announceToScreenReader(`Email error: ${message}`);
    }

    private clearEmailError(): void {
      this.emailError.textContent = '';
      this.emailError.classList.add('hidden');
      this.emailInput.setAttribute('aria-invalid', 'false');
      this.emailInput.classList.remove('input-error');
    }

    private showGeneralError(message: string): void {
      const errorText = this.generalError.querySelector('.error-text') as HTMLElement;
      
      // Provide user-friendly error messages
      const friendlyMessage = this.getFriendlyErrorMessage(message);
      errorText.textContent = friendlyMessage;
      
      this.generalError.classList.remove('hidden');
      this.hideNetworkError(); // Hide network error if showing
      
      // Announce error to screen readers
      this.announceToScreenReader(`Error: ${friendlyMessage}`);
      
      // Focus management
      this.generalError.setAttribute('tabindex', '-1');
      this.generalError.focus();
    }

    private showNetworkError(): void {
      const networkError = this.form.querySelector('.network-error') as HTMLElement;
      if (networkError) {
        networkError.classList.remove('hidden');
        this.generalError.classList.add('hidden'); // Hide general error
        
        // Announce to screen readers
        this.announceToScreenReader('Connection issue: Please check your internet connection and try again');
        
        // Focus management
        networkError.setAttribute('tabindex', '-1');
        networkError.focus();
      }
    }

    private hideNetworkError(): void {
      const networkError = this.form.querySelector('.network-error') as HTMLElement;
      if (networkError) {
        networkError.classList.add('hidden');
        networkError.removeAttribute('tabindex');
      }
    }

    private getFriendlyErrorMessage(originalMessage: string): string {
      // Map technical errors to user-friendly messages
      const errorMap: Record<string, string> = {
        [this.ERROR_MESSAGES.ALREADY_SUBSCRIBED]: "You're already subscribed! Check your email for our latest updates.",
        [this.ERROR_MESSAGES.SERVER_ERROR]: "Our newsletter service is temporarily unavailable. Please try again in a few minutes.",
        [this.ERROR_MESSAGES.RATE_LIMITED]: "You've tried subscribing several times recently. Please wait a moment before trying again.",
        [this.ERROR_MESSAGES.GENERIC_ERROR]: "Something went wrong while processing your subscription. Please try again."
      };

      return errorMap[originalMessage] || originalMessage;
    }

    private clearMessages(): void {
      this.clearEmailError();
      this.successMessage.classList.add('hidden');
      this.generalError.classList.add('hidden');
      this.hideNetworkError();
      this.successMessage.removeAttribute('tabindex');
      this.generalError.removeAttribute('tabindex');
    }

    private announceToScreenReader(message: string): void {
      this.submitStatus.textContent = message;
      
      // Clear the announcement after a short delay to allow for re-announcements
      setTimeout(() => {
        this.submitStatus.textContent = '';
      }, 1000);
    }
  }

export function initNewsletterForms(): void {
  const newsletterForms = document.querySelectorAll(
    '.newsletter-form'
  ) as NodeListOf<HTMLFormElement>;

  newsletterForms.forEach((form) => {
    if (form.dataset.newsletterInit === 'true') return;
    form.dataset.newsletterInit = 'true';
    new NewsletterFormHandler(form);
  });
}

initNewsletterForms();

declare global {
  interface Window {
    initNewsletterForm?: (formElement: HTMLFormElement) => void;
  }
}

window.initNewsletterForm = (formElement: HTMLFormElement) => {
  new NewsletterFormHandler(formElement);
};
