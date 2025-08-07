// Test script for the new secure hash function
import { SecurityUtils } from './src/config/security.js';

async function testSecureHash() {
  console.log('Testing secure hash implementation...');
  
  try {
    // Test the new cryptoHash function
    const testData = 'Hello, World!';
    const hexHash = await SecurityUtils.cryptoHash(testData, 'hex');
    const base64Hash = await SecurityUtils.cryptoHash(testData, 'base64');
    
    console.log('✅ Hex hash:', hexHash);
    console.log('✅ Base64 hash:', base64Hash);
    
    // Test the legacy simpleHash wrapper
    const legacyHash = await SecurityUtils.simpleHash(testData);
    console.log('✅ Legacy hash (deprecated):', legacyHash);
    
    // Verify consistency
    const hexHash2 = await SecurityUtils.cryptoHash(testData, 'hex');
    if (hexHash === hexHash2) {
      console.log('✅ Hash consistency verified');
    } else {
      console.error('❌ Hash inconsistency detected');
    }
    
    // Test with different inputs
    const hash1 = await SecurityUtils.cryptoHash('test1');
    const hash2 = await SecurityUtils.cryptoHash('test2');
    
    if (hash1 !== hash2) {
      console.log('✅ Different inputs produce different hashes');
    } else {
      console.error('❌ Hash collision detected!');
    }
    
    console.log('✅ All security hash tests passed!');
    
  } catch (error) {
    console.error('❌ Security hash test failed:', error.message);
  }
}

testSecureHash();
