#!/usr/bin/env node

/**
 * Deployment script with comprehensive logging
 * Integrates DeploymentLogger with actual deployment process
 */

import { execSync } from 'child_process';
import DeploymentLogger from './deployment-logger.js';

const logger = new DeploymentLogger({
  logLevel: process.env.LOG_LEVEL || 'info'
});

async function deploy() {
  const deploymentType = process.env.DEPLOY_TYPE || 'production';
  const startTime = Date.now();

  try {
    // Start deployment tracking
    logger.startDeployment(deploymentType, {
      site: process.env.NETLIFY_SITE_ID || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      commit: process.env.GITHUB_SHA || 'unknown'
    });

    logger.info('Building site for deployment');
    
    // Build the site
    try {
      execSync('pnpm build', { stdio: 'inherit' });
      logger.info('Site build completed successfully');
    } catch (error) {
      logger.error('Site build failed', { error: error.message });
      throw error;
    }

    logger.info('Starting Netlify deployment');

    // Deploy to Netlify
    let deployCommand;
    if (deploymentType === 'preview') {
      deployCommand = 'npx netlify deploy --dir=dist --json';
    } else {
      deployCommand = 'npx netlify deploy --dir=dist --prod --json';
    }

    try {
      const deployOutput = execSync(deployCommand, { encoding: 'utf8' });
      const deployResult = JSON.parse(deployOutput);
      
      const duration = Date.now() - startTime;
      logger.deploymentSuccess(deployResult.deploy_url || deployResult.url, duration);
      
      logger.info('Deployment completed', {
        url: deployResult.deploy_url || deployResult.url,
        deployId: deployResult.deploy_id,
        siteName: deployResult.site_name
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.deploymentFailure(error, duration);
      throw error;
    }

  } catch (error) {
    logger.error('Deployment process failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    // Always finalize logging
    logger.finalize();
  }
}

// Run deployment if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy().catch(error => {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  });
}

export default deploy;