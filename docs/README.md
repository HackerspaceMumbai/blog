# Hackerspace Mumbai Website Documentation

This documentation provides comprehensive guidelines for developing, maintaining, and extending the Hackerspace Mumbai website components.

## 📚 Documentation Structure

- [Content Creation Guide](./content-creation.md) - Complete guide for creating blog posts with colocated images
- [Component Documentation](./components/README.md) - Detailed documentation for all components
- [Accessibility Guidelines](./accessibility/README.md) - Implementation guidelines for accessibility
- [Mobile-First Design Guidelines](./design/README.md) - Mobile-first design principles and patterns
- [Testing Procedures](./testing/README.md) - Testing procedures and best practices

## 🚀 Quick Start

1. **Development Setup**
   ```bash
   pnpm install
   pnpm dev
   ```
   
   **Built-in Development Tools**: When you run `pnpm run dev`, you'll see integrated testing tools in your browser:
   - **Accessibility Tester**: Left sidebar panel with real-time accessibility audits
   - **Compatibility Tester**: Development toolbar for cross-browser testing
   - **Performance Monitor**: Core Web Vitals tracking
   
   See [Testing Procedures](./testing/README.md#built-in-development-testing-tools) for detailed usage.

2. **Building for Production**
   ```bash
   pnpm build
   pnpm preview
   ```

3. **Running Tests**
   ```bash
   pnpm test
   pnpm test:a11y
   pnpm test:cross-browser
   pnpm test:security
   ```

## 🏗️ Architecture Overview

The website is built using:
- **Astro** - Static site generator with component islands
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind CSS
- **TypeScript** - Type safety and better developer experience

## 📱 Mobile-First Approach

All components are designed with a mobile-first approach, ensuring optimal performance and user experience across all devices.

## ♿ Accessibility First

Every component includes comprehensive accessibility features, following WCAG 2.1 AA guidelines.

## 🔒 Security & Privacy

The website implements comprehensive security measures and privacy-respecting analytics.

## 📊 Performance Monitoring

Built-in performance monitoring tracks Core Web Vitals and provides real-time insights.

---

For detailed information, please refer to the specific documentation sections linked above.