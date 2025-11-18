# GitHub Setup Instructions

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the green "New" button or go to https://github.com/new
3. Repository name: `host-helper-clean`
4. Description: "Professional cleaning management platform for rental hosts"
5. Keep it Public (or Private if you prefer)
6. DO NOT initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these in your terminal:

```bash
cd /Users/noahwilson/host-helper-clean

# Add your GitHub repository as the remote origin
git remote add origin https://github.com/YOUR_USERNAME/host-helper-clean.git

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Enable GitHub Pages (for free hosting)

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Click "Save"
7. Your site will be available at: `https://YOUR_USERNAME.github.io/host-helper-clean`

## Step 4: Add Custom Domain (hosthelperclean.com)

1. In GitHub Pages settings, under "Custom domain"
2. Enter: `hosthelperclean.com`
3. Click "Save"
4. GitHub will create a CNAME file automatically

## Step 5: Configure DNS (at your domain registrar)

Add these DNS records at your domain registrar:

### Option A: Using CNAME (Recommended)
- Type: CNAME
- Host: www
- Value: YOUR_USERNAME.github.io
- TTL: 3600

- Type: A
- Host: @
- Value: 185.199.108.153
- TTL: 3600

- Type: A
- Host: @
- Value: 185.199.109.153
- TTL: 3600

- Type: A
- Host: @
- Value: 185.199.110.153
- TTL: 3600

- Type: A
- Host: @
- Value: 185.199.111.153
- TTL: 3600

### Option B: Using Netlify (Alternative - Better features)
1. Go to [Netlify.com](https://netlify.com)
2. Drag your `host-helper-clean` folder to deploy
3. Add custom domain in Domain Settings
4. Point your domain to Netlify's servers

## Troubleshooting

- DNS changes can take up to 48 hours to propagate
- Check GitHub Pages settings for any errors
- Ensure HTTPS is enforced in GitHub Pages settings
- You may need to wait a few minutes after setup for the site to go live

## Next Steps

Once deployed, you can update your site by:
```bash
git add .
git commit -m "Update message"
git push
```

GitHub Pages will automatically update within a few minutes!