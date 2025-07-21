# CTAButton Component

The CTAButton component is a reusable, accessible call-to-action button that follows modern design principles and accessibility standards.

## Usage

```astro
---
import CTAButton from '../components/CTAButton.astro';
---

<CTAButton 
  href="/join"
  variant="primary"
  size="lg"
  ariaLabel="Join Hackerspace Mumbai community"
>
  Join Us
</CTAButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | `undefined` | URL for the button link |
| `variant` | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `loading` | `boolean` | `false` | Whether to show loading state |
| `ariaLabel` | `string` | `undefined` | Accessible label for screen readers |
| `target` | `'_blank' \| '_self'` | `'_self'` | Link target |
| `rel` | `string` | `undefined` | Link relationship attributes |

## Examples

### Basic Usage

```astro
<CTAButton href="/events">
  View Events
</CTAButton>
```

### Different Variants

```astro
<CTAButton variant="primary" href="/join">
  Primary Action
</CTAButton>

<CTAButton variant="secondary" href="/learn-more">
  Secondary Action
</CTAButton>

<CTAButton variant="outline" href="/contact">
  Outline Button
</CTAButton>
```

### Different Sizes

```astro
<CTAButton size="sm" href="/small-action">
  Small Button
</CTAButton>

<CTAButton size="md" href="/medium-action">
  Medium Button
</CTAButton>

<CTAButton size="lg" href="/large-action">
  Large Button
</CTAButton>
```

### Loading State

```astro
<CTAButton loading={true} disabled={true}>
  Processing...
</CTAButton>
```

### External Links

```astro
<CTAButton 
  href="https://github.com/HackerspaceMumbai"
  target="_blank"
  rel="noopener noreferrer"
  ariaLabel="Visit our GitHub repository (opens in new tab)"
>
  GitHub
</CTAButton>
```

## Accessibility Features

- **Keyboard Navigation**: Fully accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators with high contrast
- **Touch Targets**: Minimum 44px touch targets for mobile
- **State Announcements**: Loading and disabled states announced to screen readers

## Styling

The component uses DaisyUI classes and follows the design system:

```css
/* Primary variant */
.btn-primary {
  background-color: var(--primary);
  color: var(--primary-content);
  border: 1px solid var(--primary);
}

/* Focus states */
.btn:focus {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* Touch-friendly sizing */
.btn-sm { min-height: 2rem; padding: 0 0.75rem; }
.btn-md { min-height: 3rem; padding: 0 1rem; }
.btn-lg { min-height: 4rem; padding: 0 1.5rem; }
```

## Best Practices

### Do's ✅

- Use descriptive button text that explains the action
- Provide `ariaLabel` for buttons with icon-only content
- Use appropriate variants for visual hierarchy
- Ensure sufficient color contrast
- Test with keyboard navigation

### Don'ts ❌

- Don't use vague text like "Click here" or "Read more"
- Don't rely solely on color to convey meaning
- Don't make buttons too small for touch interaction
- Don't forget to handle loading and error states

## Testing

```javascript
// Example test for CTAButton
test('CTAButton renders correctly', async ({ page }) => {
  await page.goto('/test-page');
  
  const button = page.locator('.btn-primary');
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('href', '/join');
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  
  // Test click functionality
  await button.click();
  await expect(page).toHaveURL('/join');
});
```

## Related Components

- [SecureForm](./SecureForm.md) - For form submission buttons
- [ThemeToggle](./ThemeToggle.md) - For theme switching buttons
- [LoadingSpinner](./LoadingSpinner.md) - For loading states