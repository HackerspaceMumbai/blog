# Security Upgrade: SHA-256 Hash Implementation

## Summary
Successfully replaced the insecure `simpleHash` function in `src/config/security.js` with a cryptographically secure SHA-256 implementation.

## Changes Made

### 1. New `cryptoHash()` Function
- **Location**: `SecurityUtils.cryptoHash(data, encoding)`
- **Algorithm**: SHA-256 (cryptographically secure)
- **Environment Support**: Both browser (Web Crypto API) and Node.js (crypto module)
- **Output Formats**: Hex (default) or Base64
- **Return Type**: `Promise<string>` (async)

### 2. Legacy `simpleHash()` Wrapper
- **Status**: Deprecated but maintained for backward compatibility
- **Behavior**: Logs deprecation warning and calls `cryptoHash()`
- **Return Type**: `Promise<string>` (now async)

## Security Improvements

### Before (Insecure)
```javascript
simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}
```

**Issues:**
- Non-cryptographic hash function
- Predictable and easily reversible
- Vulnerable to collision attacks
- Only 32-bit hash space
- Unsuitable for security purposes

### After (Secure)
```javascript
async cryptoHash(data, encoding = 'hex') {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Browser: Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    // ... format output
  } else if (typeof require !== 'undefined') {
    // Node.js: crypto module
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(data, 'utf8');
    return hash.digest(encoding);
  }
}
```

**Improvements:**
- SHA-256 cryptographic hash function
- 256-bit hash space (2^256 possible values)
- Collision-resistant
- One-way function (irreversible)
- Suitable for form signatures and security uses

## Usage Examples

### Recommended (New Function)
```javascript
// Generate hex hash
const hexHash = await SecurityUtils.cryptoHash('sensitive-data');

// Generate base64 hash
const base64Hash = await SecurityUtils.cryptoHash('sensitive-data', 'base64');

// Form signature example
const formData = JSON.stringify({ user: 'john', action: 'login' });
const signature = await SecurityUtils.cryptoHash(formData + secretKey);
```

### Legacy (Deprecated)
```javascript
// Still works but shows deprecation warning
const hash = await SecurityUtils.simpleHash('data');
```

## Migration Guide

### For New Code
- Always use `SecurityUtils.cryptoHash()` for any hashing needs
- Choose appropriate encoding (hex for general use, base64 for shorter strings)
- Remember it's async - use `await` or `.then()`

### For Existing Code
- No immediate action required - `simpleHash()` still works
- Gradually migrate to `cryptoHash()` when updating related code
- Test thoroughly as return values will be different

## Security Use Cases

1. **Form Signatures**: Hash form data + secret key for integrity verification
2. **Data Integrity**: Verify data hasn't been tampered with
3. **Unique Identifiers**: Generate secure, collision-resistant IDs
4. **Cache Keys**: Create secure cache keys from sensitive data

## Environment Compatibility

- ✅ Modern browsers (Web Crypto API)
- ✅ Node.js (crypto module)
- ✅ Astro build process
- ✅ Server-side rendering
- ✅ Client-side operations

## Performance Notes

- SHA-256 is computationally more expensive than the old simple hash
- This is intentional and necessary for security
- Performance impact is negligible for typical use cases
- Async nature prevents blocking the main thread

## Future Considerations

- Consider removing the deprecated `simpleHash()` function in a future major version
- Add additional hash algorithms if needed (SHA-512, BLAKE2b, etc.)
- Implement HMAC for authenticated hashing if required
