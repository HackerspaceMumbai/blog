// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Validation utilities
export * from './validation';

// Formatting utilities
export * from './formatting';

// Accessibility utilities
export * from './accessibility';

// Re-export commonly used utilities for convenience
export {
  // Validation
  isValidEmail,
  isValidUrl,
  sanitizeInput,
  validateField,
  validateForm,
  
  // Formatting
  formatDate,
  formatRelativeTime,
  truncateText,
  capitalize,
  toTitleCase,
  generateSlug,
  formatNumber,
  formatCompactNumber,
  
  // Accessibility
  generateId,
  createAriaLabel,
  announceToScreenReader,
  FocusManager,
  KeyboardNavigation,
  ScreenReaderUtils,
  FormAccessibility,
  MotionUtils
} from './validation';

export {
  formatDate,
  formatRelativeTime,
  formatTime,
  formatDateRange,
  truncateText,
  capitalize,
  toTitleCase,
  toKebabCase,
  toCamelCase,
  pluralize,
  calculateReadingTime,
  extractExcerpt,
  formatNumber,
  formatCompactNumber,
  formatCurrency,
  formatPercentage,
  generateSlug,
  extractDomain,
  isExternalUrl,
  formatList,
  sortAlphabetically,
  groupBy,
  hexToRgb,
  getContrastRatio
} from './formatting';

export {
  generateId,
  createAriaLabel,
  createAriaDescription,
  shouldBeFocusable,
  createSkipLink,
  validateColorContrast,
  announceToScreenReader,
  FocusManager,
  KeyboardNavigation,
  ScreenReaderUtils,
  FormAccessibility,
  MotionUtils
} from './accessibility';