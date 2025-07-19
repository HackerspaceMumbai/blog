// =============================================================================
// ACCESSIBILITY UTILITIES
// =============================================================================

/**
 * Generates unique IDs for form elements and ARIA relationships
 */
export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates ARIA label for screen readers
 */
export function createAriaLabel(text: string, context?: string): string {
  if (!text) return '';
  
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  return context ? `${cleanText}, ${context}` : cleanText;
}

/**
 * Generates ARIA describedby text for complex elements
 */
export function createAriaDescription(
  title: string,
  description?: string,
  additionalInfo?: string[]
): string {
  const parts = [title];
  
  if (description) {
    parts.push(description);
  }
  
  if (additionalInfo && additionalInfo.length > 0) {
    parts.push(...additionalInfo);
  }
  
  return parts.join('. ').replace(/\.\./g, '.');
}

/**
 * Checks if an element should be focusable
 */
export function shouldBeFocusable(element: {
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
}): boolean {
  return !element.disabled && !element.readonly && !element.hidden;
}

/**
 * Creates skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): string {
  return `<a href="#${targetId}" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-content focus:rounded-md focus:shadow-lg">${text}</a>`;
}

/**
 * Validates color contrast ratio for accessibility
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): { isValid: boolean; ratio: number; required: number } {
  // This is a simplified version - in production, use a proper color contrast library
  const requiredRatio = level === 'AAA' ? 7 : 4.5;
  
  // Mock calculation - replace with actual contrast calculation
  const ratio = 4.5; // This should be calculated properly
  
  return {
    isValid: ratio >= requiredRatio,
    ratio,
    required: requiredRatio
  };
}

/**
 * Creates ARIA live region announcement
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Manages focus for modal dialogs and overlays
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  
  /**
   * Traps focus within a container element
   */
  trapFocus(container: HTMLElement): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.focusableElements = this.getFocusableElements(container);
    
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
    
    container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  /**
   * Releases focus trap and returns focus to previous element
   */
  releaseFocus(container: HTMLElement): void {
    container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }
  
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    
    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handles arrow key navigation for lists and grids
   */
  static handleArrowKeys(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical'
  ): number {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          event.preventDefault();
        }
        break;
        
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          event.preventDefault();
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          event.preventDefault();
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          event.preventDefault();
        }
        break;
        
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
        
      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }
    
    return newIndex;
  }
  
  /**
   * Handles Enter and Space key activation
   */
  static handleActivation(
    event: KeyboardEvent,
    callback: () => void
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  /**
   * Creates descriptive text for complex UI elements
   */
  static describeElement(element: {
    type: string;
    label?: string;
    value?: string;
    state?: string;
    position?: { current: number; total: number };
  }): string {
    const parts = [];
    
    if (element.label) {
      parts.push(element.label);
    }
    
    parts.push(element.type);
    
    if (element.value) {
      parts.push(`value ${element.value}`);
    }
    
    if (element.state) {
      parts.push(element.state);
    }
    
    if (element.position) {
      parts.push(`${element.position.current} of ${element.position.total}`);
    }
    
    return parts.join(', ');
  }
  
  /**
   * Creates live region for dynamic content updates
   */
  static createLiveRegion(
    id: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): HTMLElement {
    if (typeof document === 'undefined') {
      throw new Error('Document not available');
    }
    
    let liveRegion = document.getElementById(id);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = id;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    return liveRegion;
  }
  
  /**
   * Updates live region with new content
   */
  static updateLiveRegion(id: string, message: string): void {
    const liveRegion = document.getElementById(id);
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }
}

/**
 * Form accessibility utilities
 */
export class FormAccessibility {
  /**
   * Associates form field with error message
   */
  static associateError(
    fieldId: string,
    errorId: string,
    errorMessage: string
  ): void {
    if (typeof document === 'undefined') return;
    
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(errorId);
    
    if (field && errorElement) {
      field.setAttribute('aria-describedby', errorId);
      field.setAttribute('aria-invalid', 'true');
      errorElement.textContent = errorMessage;
      errorElement.setAttribute('role', 'alert');
    }
  }
  
  /**
   * Removes error association
   */
  static removeError(fieldId: string, errorId: string): void {
    if (typeof document === 'undefined') return;
    
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(errorId);
    
    if (field) {
      field.removeAttribute('aria-describedby');
      field.setAttribute('aria-invalid', 'false');
    }
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.removeAttribute('role');
    }
  }
  
  /**
   * Creates accessible form field group
   */
  static createFieldGroup(
    legend: string,
    fields: Array<{ id: string; label: string; required?: boolean }>
  ): string {
    const fieldsetId = generateId('fieldset');
    const legendId = generateId('legend');
    
    const fieldElements = fields.map(field => `
      <div class="form-field">
        <label for="${field.id}" class="form-label ${field.required ? 'required' : ''}">
          ${field.label}
          ${field.required ? '<span aria-label="required">*</span>' : ''}
        </label>
        <input 
          id="${field.id}" 
          name="${field.id}"
          class="form-input"
          ${field.required ? 'required aria-required="true"' : ''}
          aria-describedby="${field.id}-error"
        />
        <div id="${field.id}-error" class="form-error" role="alert" aria-live="polite"></div>
      </div>
    `).join('');
    
    return `
      <fieldset id="${fieldsetId}" class="form-fieldset">
        <legend id="${legendId}" class="form-legend">${legend}</legend>
        ${fieldElements}
      </fieldset>
    `;
  }
}

/**
 * Reduced motion utilities
 */
export class MotionUtils {
  /**
   * Checks if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Applies animation only if motion is not reduced
   */
  static conditionalAnimation(
    element: HTMLElement,
    animation: string,
    fallback?: string
  ): void {
    if (this.prefersReducedMotion()) {
      if (fallback) {
        element.style.animation = fallback;
      }
    } else {
      element.style.animation = animation;
    }
  }
  
  /**
   * Creates CSS class for conditional animations
   */
  static getAnimationClass(
    normalClass: string,
    reducedClass?: string
  ): string {
    return this.prefersReducedMotion() 
      ? (reducedClass || 'motion-reduce') 
      : normalClass;
  }
}