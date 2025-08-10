#!/bin/bash

# Netlify Deployment Script for Hackerspace Mumbai Blog
# Usage: ./deploy.sh [environment]
# Environments: preview, production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-preview}

# Detect CI environment
IS_CI=false
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    IS_CI=true
    echo -e "${BLUE}🤖 Running in CI environment${NC}"
else
    echo -e "${BLUE}💻 Running in local development environment${NC}"
fi

echo -e "${BLUE}🚀 Deploying Hackerspace Mumbai Blog to Netlify ($ENVIRONMENT)${NC}"

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI is not installed. Installing...${NC}"
    npm install -g netlify-cli
fi

# Handle authentication based on environment
if [ "$IS_CI" = "true" ]; then
    echo -e "${BLUE}🔐 Verifying CI authentication...${NC}"
    
    # Check for required environment variables in CI
    if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
        echo -e "${RED}❌ NETLIFY_AUTH_TOKEN environment variable is required for CI deployment${NC}"
        echo -e "${YELLOW}💡 Please set NETLIFY_AUTH_TOKEN in your GitHub repository secrets${NC}"
        echo -e "${YELLOW}   Go to: Settings > Secrets and variables > Actions > New repository secret${NC}"
        exit 1
    fi
    
    if [ -z "$NETLIFY_SITE_ID" ]; then
        echo -e "${RED}❌ NETLIFY_SITE_ID environment variable is required for CI deployment${NC}"
        echo -e "${YELLOW}💡 Please set NETLIFY_SITE_ID in your GitHub repository secrets${NC}"
        echo -e "${YELLOW}   You can find your site ID in Netlify dashboard > Site settings > General${NC}"
        exit 1
    fi
    
    # Verify authentication works before deployment
    echo -e "${BLUE}🔍 Testing Netlify authentication...${NC}"
    if netlify status --json > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Netlify authentication verified${NC}"
    else
        echo -e "${RED}❌ Netlify authentication failed${NC}"
        echo -e "${YELLOW}💡 Please check that NETLIFY_AUTH_TOKEN is valid and has the correct permissions${NC}"
        exit 1
    fi
else
    # Local development - check if user is logged in to Netlify
    if ! netlify status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged in to Netlify. Please login...${NC}"
        netlify login
    fi
fi

# Check for required environment variables
echo -e "${BLUE}🔍 Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❌ Please edit .env file with your actual values before proceeding.${NC}"
    exit 1
fi

# Validate required environment variables
required_vars=("KIT_API_KEY" "KIT_FORM_ID" "SITE_URL")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=your_" .env; then
        echo -e "${RED}❌ Environment variable $var is not configured properly in .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment configuration looks good${NC}"

# Run tests before deployment
echo -e "${BLUE}🧪 Running tests...${NC}"
if npm test; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed. Please fix before deploying.${NC}"
    exit 1
fi

# Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${BLUE}🌍 Deploying to production...${NC}"
    if [ "$IS_CI" = "true" ]; then
        netlify deploy --prod --site="$NETLIFY_SITE_ID" --dir=dist --functions=netlify/functions
    else
        netlify deploy --prod --dir=dist --functions=netlify/functions
    fi
elif [ "$ENVIRONMENT" = "preview" ]; then
    echo -e "${BLUE}🔍 Deploying preview...${NC}"
    if [ "$IS_CI" = "true" ]; then
        netlify deploy --site="$NETLIFY_SITE_ID" --dir=dist --functions=netlify/functions
    else
        netlify deploy --dir=dist --functions=netlify/functions
    fi
else
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT. Use 'preview' or 'production'.${NC}"
    exit 1
fi

# Check deployment status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Get the deploy URL
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${GREEN}🌐 Your site is live at: https://hackmum.in${NC}"
    else
        echo -e "${GREEN}🔍 Preview your deployment using the URL provided above${NC}"
    fi
    
    # Run post-deployment checks
    echo -e "${BLUE}🔍 Running post-deployment checks...${NC}"
    
    # Wait a moment for deployment to propagate
    sleep 5
    
    # Determine deployment URL
    DEPLOYMENT_URL=""
    if [ "$ENVIRONMENT" = "production" ]; then
        DEPLOYMENT_URL="https://hackmum.in"
    else
        # For preview deployments, we'll use the URL from the last deployment
        # This is a simplified approach - in CI, the URL would be extracted from JSON output
        echo -e "${YELLOW}⚠️  Preview URL extraction not available in shell script${NC}"
        echo -e "${BLUE}💡 Use 'pnpm deploy:preview:with-verify' for full health check integration${NC}"
    fi
    
    # Run comprehensive health check if we have a URL
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo -e "${BLUE}🏥 Running comprehensive health check for: $DEPLOYMENT_URL${NC}"
        
        if node scripts/post-deployment-verify.js "$DEPLOYMENT_URL"; then
            echo -e "${GREEN}✅ Comprehensive health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Comprehensive health check failed, but deployment succeeded${NC}"
        fi
    else
        # Fallback to basic checks for preview deployments
        echo -e "${BLUE}🔍 Running basic accessibility check...${NC}"
        
        # Basic check - this is limited without the actual deployment URL
        if [ "$ENVIRONMENT" = "production" ]; then
            if curl -sSf https://hackmum.in > /dev/null; then
                echo -e "${GREEN}✅ Site is accessible${NC}"
            else
                echo -e "${YELLOW}⚠️  Site might not be fully propagated yet${NC}"
            fi
            
            # Check if health endpoint is working
            if curl -sSf https://hackmum.in/.netlify/functions/health > /dev/null; then
                echo -e "${GREEN}✅ Health endpoint is responding${NC}"
            else
                echo -e "${RED}❌ Health endpoint is not responding${NC}"
            fi
        fi
    fi
    
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
