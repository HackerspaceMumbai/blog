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

echo -e "${BLUE}🚀 Deploying Hackerspace Mumbai Blog to Netlify ($ENVIRONMENT)${NC}"

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI is not installed. Installing...${NC}"
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Netlify. Please login...${NC}"
    netlify login
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
    netlify deploy --prod --dir=dist --functions=netlify/functions
elif [ "$ENVIRONMENT" = "preview" ]; then
    echo -e "${BLUE}🔍 Deploying preview...${NC}"
    netlify deploy --dir=dist --functions=netlify/functions
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
    
    # Check if the site is accessible (for production)
    if [ "$ENVIRONMENT" = "production" ]; then
        if curl -sSf https://hackmum.in > /dev/null; then
            echo -e "${GREEN}✅ Site is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Site might not be fully propagated yet${NC}"
        fi
        
        # Check if newsletter API is working
        if curl -sSf -X OPTIONS https://hackmum.in/api/newsletter > /dev/null; then
            echo -e "${GREEN}✅ Newsletter API is responding${NC}"
        else
            echo -e "${RED}❌ Newsletter API is not responding${NC}"
        fi
    fi
    
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
