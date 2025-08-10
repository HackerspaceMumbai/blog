
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deployWithRetry, verifyDeploymentStatus, sanitizeErrorMessage, calculateDelay, isRetryableError } from '../deploy-with-retry.js';

let spawn;
beforeAll(async () => {
  // Dynamically import child_process for ESM compatibility
  const childProcess = await import('child_process');
  spawn = childProcess.spawn;
  vi.mock('child_process');
});

// ...existing code...
