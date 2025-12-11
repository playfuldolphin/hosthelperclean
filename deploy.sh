#!/bin/bash

# Host Helper Clean - Automated Deployment Script
# This script automates deployment to various platforms

set -e  # Exit on error

echo "🚀 Host Helper Clean - Automated Deployment"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "chore: automated deployment commit"
    print_success "Changes committed"
fi

# Show deployment options
echo ""
echo "Choose your deployment platform:"
echo "1) Railway.app (Recommended - Easiest)"
echo "2) Render.com (Good alternative)"
echo "3) Vercel (Frontend + Serverless)"
echo "4) Heroku (Traditional PaaS)"
echo "5) Manual setup instructions"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        print_info "Deploying to Railway.app..."
        echo ""
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            print_warning "Railway CLI not installed. Installing..."
            npm install -g @railway/cli
            print_success "Railway CLI installed"
        fi
        
        # Login to Railway
        print_info "Please login to Railway in your browser..."
        railway login
        
        # Initialize project
        print_info "Initializing Railway project..."
        railway init
        
        # Add PostgreSQL
        print_info "Adding PostgreSQL database..."
        railway add postgresql
        
        # Set environment variables
        print_info "Setting environment variables..."
        echo ""
        read -p "Enter your Stripe Secret Key (sk_test_...): " stripe_secret
        read -p "Enter your Stripe Publishable Key (pk_test_...): " stripe_pub
        read -p "Enter your Stripe Webhook Secret (whsec_...): " stripe_webhook
        
        railway variables set STRIPE_SECRET_KEY="$stripe_secret"
        railway variables set STRIPE_PUBLISHABLE_KEY="$stripe_pub"
        railway variables set STRIPE_WEBHOOK_SECRET="$stripe_webhook"
        railway variables set NODE_ENV=production
        railway variables set JWT_SECRET="$(openssl rand -base64 32)"
        
        # Deploy
        print_info "Deploying to Railway..."
        railway up
        
        # Get domain
        DOMAIN=$(railway domain)
        print_success "Deployment complete!"
        echo ""
        print_info "Your app is live at: $DOMAIN"
        
        # Setup database
        print_info "Setting up database..."
        railway run npm run db:setup
        
        print_success "Database setup complete!"
        echo ""
        print_warning "IMPORTANT: Update your Stripe webhook URL to: $DOMAIN/api/webhook"
        echo ""
        ;;
        
    2)
        echo ""
        print_info "Deploying to Render.com..."
        echo ""
        print_warning "Render deployment requires manual setup in dashboard."
        echo ""
        echo "Steps to deploy on Render:"
        echo "1. Go to https://dashboard.render.com"
        echo "2. Click 'New +' → 'Blueprint'"
        echo "3. Connect your GitHub repository"
        echo "4. Render will auto-detect render.yaml"
        echo "5. Set your environment variables in the dashboard"
        echo "6. Click 'Apply' to deploy"
        echo ""
        echo "render.yaml has been created in your project root"
        print_success "Ready for Render deployment!"
        ;;
        
    3)
        echo ""
        print_info "Deploying to Vercel..."
        echo ""
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            print_warning "Vercel CLI not installed. Installing..."
            npm install -g vercel
            print_success "Vercel CLI installed"
        fi
        
        print_info "Please login to Vercel..."
        vercel login
        
        print_info "Deploying to Vercel..."
        vercel --prod
        
        print_success "Deployment complete!"
        print_warning "Note: Vercel is serverless. You'll need a separate database (use Railway for PostgreSQL)"
        ;;
        
    4)
        echo ""
        print_info "Deploying to Heroku..."
        echo ""
        
        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            print_error "Heroku CLI not installed"
            echo "Install from: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        print_info "Please login to Heroku..."
        heroku login
        
        read -p "Enter your app name (or press Enter for random): " app_name
        
        if [ -z "$app_name" ]; then
            heroku create
        else
            heroku create "$app_name"
        fi
        
        # Add PostgreSQL
        print_info "Adding PostgreSQL..."
        heroku addons:create heroku-postgresql:mini
        
        # Set environment variables
        print_info "Setting environment variables..."
        echo ""
        read -p "Enter your Stripe Secret Key: " stripe_secret
        read -p "Enter your Stripe Publishable Key: " stripe_pub
        read -p "Enter your Stripe Webhook Secret: " stripe_webhook
        
        heroku config:set STRIPE_SECRET_KEY="$stripe_secret"
        heroku config:set STRIPE_PUBLISHABLE_KEY="$stripe_pub"
        heroku config:set STRIPE_WEBHOOK_SECRET="$stripe_webhook"
        heroku config:set NODE_ENV=production
        heroku config:set JWT_SECRET="$(openssl rand -base64 32)"
        
        # Deploy
        print_info "Deploying to Heroku..."
        git push heroku main
        
        # Setup database
        print_info "Setting up database..."
        heroku run npm run db:setup
        
        APP_URL=$(heroku info -s | grep web_url | cut -d= -f2)
        print_success "Deployment complete!"
        echo ""
        print_info "Your app is live at: $APP_URL"
        print_warning "IMPORTANT: Update your Stripe webhook URL to: ${APP_URL}api/webhook"
        ;;
        
    5)
        echo ""
        print_info "Manual Setup Instructions"
        echo ""
        echo "For Railway.app:"
        echo "  1. Install Railway CLI: npm install -g @railway/cli"
        echo "  2. Login: railway login"
        echo "  3. Initialize: railway init"
        echo "  4. Add PostgreSQL: railway add postgresql"
        echo "  5. Deploy: railway up"
        echo "  6. Setup database: railway run npm run db:setup"
        echo ""
        echo "For Render.com:"
        echo "  1. Go to https://dashboard.render.com"
        echo "  2. Create new Blueprint from repo"
        echo "  3. Use render.yaml configuration"
        echo ""
        echo "For Vercel:"
        echo "  1. Install Vercel CLI: npm install -g vercel"
        echo "  2. Login: vercel login"
        echo "  3. Deploy: vercel --prod"
        echo ""
        print_success "Configuration files created!"
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "============================================"
print_success "Deployment process complete!"
echo ""
echo "Next steps:"
echo "1. ✅ Test your deployment URL"
echo "2. ✅ Update Stripe webhook endpoint"
echo "3. ✅ Test a booking with Stripe test card"
echo "4. ✅ Verify emails are sending"
echo "5. ✅ Switch to Stripe live mode when ready"
echo ""
print_success "Happy launching! 🚀"
