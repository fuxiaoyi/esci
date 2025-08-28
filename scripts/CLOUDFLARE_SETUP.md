# Cloudflare CDN Setup Guide

This guide will help you set up Cloudflare CDN for image storage in the experiment data loading script.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain**: A domain managed by Cloudflare (or use Cloudflare Images service)

## Step 1: Get Your Account ID

1. Log into your Cloudflare dashboard
2. Look at the right sidebar - your Account ID is displayed there
3. Copy this ID (it's a 32-character hexadecimal string)

## Step 2: Create API Token

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Choose **Custom token** template
4. Configure the token with these permissions:

### Permissions Required:
- **Zone**: Include → All zones
- **Account**: Cloudflare Images → Edit
- **Account**: Cloudflare Images → Read

### Zone Resources:
- Include → All zones

5. Click **Continue to summary**
6. Give your token a name (e.g., "Experiment Data Script")
7. Click **Create Token**
8. **Copy the token immediately** (you won't see it again!)

## Step 3: Environment Variables

Add these to your `.env` file:

```bash
CLOUDFLARE_ACCOUNT_ID=your-32-character-account-id
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_DOMAIN=your-domain.com
```

## Step 4: Verify Setup

1. Run the script: `node scripts/run-load-experiment-data.js`
2. You should see: `☁️  Using Cloudflare CDN for image storage`
3. Images will be uploaded to Cloudflare and URLs stored in the database

## Troubleshooting

### "Missing Cloudflare environment variables"
- Check your `.env` file has the correct variables
- Ensure no extra spaces or quotes around values

### "Cloudflare upload failed"
- Verify your API token has the correct permissions
- Check your Account ID is correct
- Ensure your Cloudflare account has Images service enabled

### "Authorization failed"
- Your API token may have expired or incorrect permissions
- Create a new token with the correct permissions

## Benefits of Cloudflare CDN

- **Fast Global Delivery**: Images served from edge locations worldwide
- **Automatic Optimization**: Images are automatically optimized
- **Cost Effective**: Pay only for what you use
- **Scalable**: Handles any amount of traffic
- **Secure**: Built-in DDoS protection and security features

## Alternative: Using Cloudflare Images Service

If you don't have a domain on Cloudflare, you can still use their Images service:

1. Go to **Images** in your Cloudflare dashboard
2. Upload images manually to test
3. Use the same API token setup as above
4. Images will be stored in Cloudflare's global network
