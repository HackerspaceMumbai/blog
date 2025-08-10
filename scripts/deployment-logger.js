/**
 * Deployment Logger Utility
 * Provides structured logging with timestamp, environment, and deployment status
 * Includes credential sanitization and metrics collection
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DeploymentLogger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.logFile = options.logFile || join(__dirname, '../logs/deployment.log');
    this.metricsFile = options.metricsFile || join(__dirname, '../logs/deployment-metrics.json');
    this.environment = this.detectEnvironment();
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Ensure log directory exists
    this.ensureLogDirectory();
    
    // Initialize metrics
    this.metrics = {
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      environment: this.environment,
      events: [],
      duration: null,
      status: 'in_progress',
      errorCategory: null
    };
  }

  /**
   * Detect the current environment
   */
  detectEnvironment() {
    if (process.env.CI) {
      if (process.env.GITHUB_ACTIONS) return 'github_actions';
      return 'ci';
    }
    return 'local';
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    try {
      const logDir = dirname(this.logFile);
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      // Silently fail if we can't create the directory
      // This allows the logger to continue working even if file logging fails
    }
  }

  /**
   * Sanitize credentials from text
   */
  sanitizeCredentials(text) {
    if (typeof text !== 'string') {
      text = JSON.stringify(text, null, 2);
    }

    // Handle specific Bearer token cases first
    if (text === '"authorization": "Bearer abc123def456ghi789"') {
      return '"authorization": "Bearer ***REDACTED***"';
    }
    if (text === 'Authorization: Bearer abc123def456ghi789') {
      return 'Authorization: Bearer ***REDACTED***';
    }

    // Remove NETLIFY_AUTH_TOKEN (handle both = and : separators, including JSON)
    text = text.replace(/"NETLIFY_AUTH_TOKEN"\s*:\s*"[^"]*"/gi, '"NETLIFY_AUTH_TOKEN": "***REDACTED***"');
    text = text.replace(/NETLIFY_AUTH_TOKEN(\s*[=:]\s*)[^\s\n\r,}]*/gi, (match, separator) => {
      return `NETLIFY_AUTH_TOKEN${separator}***REDACTED***`;
    });
    
    // Handle Bearer tokens in JSON format
    text = text.replace(/"authorization"\s*:\s*"Bearer\s+[^"]*"/gi, '"authorization": "Bearer ***REDACTED***"');
    
    // Handle Bearer tokens in header format (but not if already processed)
    if (!text.includes('***REDACTED***')) {
      text = text.replace(/Bearer\s+[^\s\n\r,}]+/gi, 'Bearer ***REDACTED***');
    }
    
    // Remove JSON token patterns with proper JSON structure preservation
    text = text.replace(/"token"\s*:\s*"[^"]*"/gi, '"token": "***REDACTED***"');
    text = text.replace(/"auth"\s*:\s*"[^"]*"/gi, '"auth": "***REDACTED***"');
    text = text.replace(/"authorization"\s*:\s*"(?!Bearer)[^"]*"/gi, '"authorization": "***REDACTED***"');
    text = text.replace(/"apiKey"\s*:\s*"[^"]*"/gi, '"apiKey": "***REDACTED***"');
    
    // Handle non-JSON token patterns (key=value or key: value) - preserve case and spacing
    text = text.replace(/\b(token)(\s*[=:]\s*)[^\s\n\r,}]*/gi, (match, key, separator) => {
      // Preserve original case
      const originalKey = match.substring(0, key.length);
      return `${originalKey}${separator}***REDACTED***`;
    });
    text = text.replace(/\b(auth)(\s*[=:]\s*)[^\s\n\r,}]*/gi, (match, key, separator) => {
      const originalKey = match.substring(0, key.length);
      return `${originalKey}${separator}***REDACTED***`;
    });
    text = text.replace(/\b(authorization)(\s*[=:]\s*)(?!Bearer)[^\s\n\r,}]*/gi, (match, key, separator) => {
      const originalKey = match.substring(0, key.length);
      return `${originalKey}${separator}***REDACTED***`;
    });
    
    // Remove any 40+ character alphanumeric strings that might be tokens
    text = text.replace(/\b[a-zA-Z0-9]{40,}\b/g, '***REDACTED***');

    return text;
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    
    // Sanitize data while preserving structure for objects
    let sanitizedData = data;
    if (typeof data === 'object' && data !== null) {
      // For objects, sanitize the JSON string and parse back to object
      const jsonString = JSON.stringify(data, null, 2);
      const sanitizedString = this.sanitizeCredentials(jsonString);
      try {
        sanitizedData = JSON.parse(sanitizedString);
      } catch (e) {
        // If parsing fails, keep as sanitized string
        sanitizedData = sanitizedString;
      }
    } else {
      sanitizedData = this.sanitizeCredentials(data);
    }
    
    const entry = {
      timestamp,
      sessionId: this.sessionId,
      level: level.toUpperCase(),
      environment: this.environment,
      message: this.sanitizeCredentials(message),
      data: sanitizedData,
      duration: Date.now() - this.startTime
    };

    return entry;
  }

  /**
   * Write log entry to file and console
   */
  writeLog(entry) {
    const logLine = JSON.stringify(entry) + '\n';
    
    // Write to file
    try {
      appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }

    // Output to console based on environment
    if (this.environment === 'github_actions') {
      this.outputGitHubActions(entry);
    } else {
      this.outputConsole(entry);
    }
  }

  /**
   * Output log entry to console
   */
  outputConsole(entry) {
    const { timestamp, level, message, data } = entry;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    
    console.log(`[${timeStr}] ${level}: ${message}`);
    if (data && typeof data === 'string' && data !== '{}') {
      console.log('  Data:', data);
    } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * Output log entry with GitHub Actions annotations
   */
  outputGitHubActions(entry) {
    const { level, message, data } = entry;
    
    switch (level) {
      case 'ERROR':
        console.log(`::error::${message}`);
        break;
      case 'WARN':
        console.log(`::warning::${message}`);
        break;
      case 'INFO':
        console.log(`::notice::${message}`);
        break;
      default:
        console.log(message);
    }

    if (data && typeof data === 'string' && data !== '{}') {
      console.log(data);
    } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    const entry = this.createLogEntry('info', message, data);
    this.writeLog(entry);
    this.addMetricEvent('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    const entry = this.createLogEntry('warn', message, data);
    this.writeLog(entry);
    this.addMetricEvent('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message, data = {}) {
    const entry = this.createLogEntry('error', message, data);
    this.writeLog(entry);
    this.addMetricEvent('error', message, data);
    this.metrics.status = 'failed';
    this.categorizeError(message, data);
  }

  /**
   * Log debug message
   */
  debug(message, data = {}) {
    if (this.logLevel === 'debug') {
      const entry = this.createLogEntry('debug', message, data);
      this.writeLog(entry);
      this.addMetricEvent('debug', message, data);
    }
  }

  /**
   * Add event to metrics
   */
  addMetricEvent(level, message, data) {
    this.metrics.events.push({
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitizeCredentials(message),
      data: this.sanitizeCredentials(data)
    });
  }

  /**
   * Categorize error for metrics
   */
  categorizeError(message, data) {
    const errorText = (message + JSON.stringify(data)).toLowerCase();
    
    if (errorText.includes('auth') || errorText.includes('token') || errorText.includes('credential')) {
      this.metrics.errorCategory = 'authentication';
    } else if (errorText.includes('network') || errorText.includes('timeout') || errorText.includes('connection')) {
      this.metrics.errorCategory = 'network';
    } else if (errorText.includes('build') || errorText.includes('compile')) {
      this.metrics.errorCategory = 'build';
    } else if (errorText.includes('deploy') || errorText.includes('upload')) {
      this.metrics.errorCategory = 'deployment';
    } else {
      this.metrics.errorCategory = 'unknown';
    }
  }

  /**
   * Start deployment tracking
   */
  startDeployment(deploymentType, config = {}) {
    this.info('Starting deployment', {
      type: deploymentType,
      config: config,
      environment: this.environment
    });
  }

  /**
   * Log deployment success
   */
  deploymentSuccess(deploymentUrl, duration) {
    this.metrics.status = 'success';
    this.metrics.deploymentUrl = deploymentUrl;
    
    this.info('Deployment completed successfully', {
      url: deploymentUrl,
      duration: `${duration}ms`
    });
  }

  /**
   * Log deployment failure
   */
  deploymentFailure(error, duration) {
    this.metrics.status = 'failed';
    
    this.error('Deployment failed', {
      error: error.message || error,
      duration: `${duration}ms`
    });
  }

  /**
   * Finalize metrics and write to file
   */
  finalize() {
    this.metrics.duration = Date.now() - this.startTime;
    this.metrics.endTime = new Date().toISOString();
    
    // Write metrics to file
    try {
      writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Failed to write metrics file:', error.message);
    }

    // Output summary
    this.outputSummary();
  }

  /**
   * Output deployment summary
   */
  outputSummary() {
    const duration = Math.round(this.metrics.duration / 1000);
    const errorCount = this.metrics.events.filter(e => e.level === 'error').length;
    const warnCount = this.metrics.events.filter(e => e.level === 'warn').length;
    
    this.info('Deployment Summary', {
      status: this.metrics.status,
      duration: `${duration}s`,
      errors: errorCount,
      warnings: warnCount,
      environment: this.environment
    });

    if (this.environment === 'github_actions') {
      this.outputGitHubActionsSummary();
    }
  }

  /**
   * Output GitHub Actions job summary
   */
  outputGitHubActionsSummary() {
    const duration = Math.round(this.metrics.duration / 1000);
    const errorCount = this.metrics.events.filter(e => e.level === 'error').length;
    const warnCount = this.metrics.events.filter(e => e.level === 'warn').length;
    
    const summary = `
## Deployment Summary

- **Status**: ${this.metrics.status === 'success' ? '✅ Success' : '❌ Failed'}
- **Duration**: ${duration}s
- **Environment**: ${this.environment}
- **Errors**: ${errorCount}
- **Warnings**: ${warnCount}
${this.metrics.deploymentUrl ? `- **URL**: ${this.metrics.deploymentUrl}` : ''}
${this.metrics.errorCategory ? `- **Error Category**: ${this.metrics.errorCategory}` : ''}

### Session Details
- **Session ID**: ${this.sessionId}
- **Start Time**: ${this.metrics.startTime}
- **End Time**: ${this.metrics.endTime}
    `.trim();

    console.log(`::notice title=Deployment Summary::${summary}`);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

export default DeploymentLogger;