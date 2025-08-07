#!/usr/bin/env node

/**
 * Visual Regression Test Runner
 * 
 * Runs visual regression tests for blog image display functionality.
 * Ensures the dev server is running and manages the test lifecycle.
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class VisualRegressionRunner {
  constructor() {
    this.devServerProcess = null;
    this.serverReady = false;
  }
  
  async checkServerRunning() {
    try {
      const { stdout } = await execAsync('curl -f http://localhost:4321 2>/dev/null');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async startDevServer() {
    console.log('🚀 Starting development server...');
    
    return new Promise((resolve, reject) => {
      this.devServerProcess = spawn('pnpm', ['dev'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let output = '';
      
      this.devServerProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Local:') && output.includes('4321')) {
          console.log('✅ Development server is ready');
          this.serverReady = true;
          resolve();
        }
      });
      
      this.devServerProcess.stderr.on('data', (data) => {
        console.error('Dev server error:', data.toString());
      });
      
      this.devServerProcess.on('error', (error) => {
        console.error('Failed to start dev server:', error);
        reject(error);
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.serverReady) {
          reject(new Error('Dev server failed to start within 30 seconds'));
        }
      }, 30000);
    });
  }
  
  async stopDevServer() {
    if (this.devServerProcess) {
      console.log('🛑 Stopping development server...');
      this.devServerProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise(resolve => {
        this.devServerProcess.on('exit', resolve);
        setTimeout(() => {
          this.devServerProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  }
  
  async runVisualTests() {
    console.log('📸 Running visual regression tests...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('pnpm', ['test:visual:ci'], {
        stdio: 'inherit'
      });
      
      testProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ Visual regression tests passed');
          resolve();
        } else {
          console.log('❌ Visual regression tests failed');
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });
      
      testProcess.on('error', (error) => {
        console.error('Failed to run tests:', error);
        reject(error);
      });
    });
  }
  
  async run() {
    let serverWasRunning = false;
    
    try {
      // Check if server is already running
      serverWasRunning = await this.checkServerRunning();
      
      if (!serverWasRunning) {
        await this.startDevServer();
        // Give server a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('✅ Development server already running');
      }
      
      // Run the visual regression tests
      await this.runVisualTests();
      
      console.log('🎉 Visual regression testing completed successfully');
      
    } catch (error) {
      console.error('💥 Visual regression testing failed:', error.message);
      process.exit(1);
    } finally {
      // Only stop server if we started it
      if (!serverWasRunning) {
        await this.stopDevServer();
      }
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new VisualRegressionRunner();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal, cleaning up...');
    await runner.stopDevServer();
    process.exit(0);
  });
  
  runner.run();
}

export default VisualRegressionRunner;