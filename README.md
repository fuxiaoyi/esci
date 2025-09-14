# Edge Science - React Application with Supabase Authentication

This project is a React application that uses Supabase for authentication and user management. It's configured for automatic deployment on Vercel with PostgreSQL database support.

## Features

- User registration and authentication with Supabase
- Protected routes for authenticated users
- Password reset functionality
- Modern UI with Tailwind CSS and Shadcn UI components
- Agent-based task management system
- Multi-language support (i18n)
- Stripe payment integration
- OAuth provider support (Google, GitHub, Discord)
- Vercel-optimized deployment configuration

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- A Supabase account and project
- A PostgreSQL database (for production)
- Vercel account (for deployment)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ecopi-edu-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project:
   - Go to [Supabase](https://supabase.com/) and sign up or log in
   - Create a new project
   - Once your project is created, go to Project Settings > API
   - Copy the URL and anon/public key

4. Create a `.env` file in the root directory with your credentials:
```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Public Environment Variables
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_PATH="/api"
```

5. Start the development server:
```bash
npm run dev
```

## Vercel Deployment

This project is configured for automatic deployment on Vercel. Follow these steps to deploy your application.

### Prerequisites for Deployment

1. A Vercel account
2. A PostgreSQL database (recommended: Vercel Postgres, Supabase, or PlanetScale)
3. Required API keys and secrets

### Environment Variables

Set the following environment variables in your Vercel project settings:

#### Required Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database_name"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Public Environment Variables
NEXT_PUBLIC_BACKEND_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_BACKEND_PATH="/api"
```

#### Optional Variables

```bash
# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Redis
REDIS_URL="redis://username:password@host:port"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
STRIPE_PRICE_ID="your-stripe-price-id"

# Other
NEXT_PUBLIC_CDN=""
NEXT_PUBLIC_EXPERIMENTAL_FF_ENABLED="false"
NEXT_PUBLIC_VERCEL_ENV="production"
NEXT_PUBLIC_MAX_LOOPS="25"
NEXT_PUBLIC_PUSHER_APP_KEY=""
NEXT_PUBLIC_FF_MOCK_MODE_ENABLED="false"
NEXT_PUBLIC_FF_SID_ENABLED="false"
```

### Deployment Steps

#### 1. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect this as a Next.js project

#### 2. Configure Environment Variables

1. In your Vercel project settings, go to "Environment Variables"
2. Add all the required environment variables listed above
3. Make sure to set them for Production, Preview, and Development environments

#### 3. Database Setup

1. Set up a PostgreSQL database (recommended: Vercel Postgres)
2. Copy the connection string to your `DATABASE_URL` environment variable
3. The database will be automatically migrated on first deployment

#### 4. Deploy

1. Push your code to the main branch
2. Vercel will automatically build and deploy your application
3. The build process includes:
   - Installing dependencies
   - Generating Prisma client
   - Building the Next.js application

### Build Configuration

The project includes the following Vercel-specific configurations:

- **vercel.json**: Defines build commands and function settings
- **vercel-build script**: Ensures Prisma client is generated before building
- **PostgreSQL schema**: Optimized for production database
- **Environment validation**: Skips validation during build process

### Troubleshooting Deployment

#### Common Issues

1. **Build Failures**: Check that all required environment variables are set
2. **Database Connection**: Ensure your `DATABASE_URL` is correct and accessible
3. **Prisma Issues**: Make sure the database schema is up to date
4. **TypeScript Errors**: The build is configured to ignore TypeScript errors, but check for critical issues

#### Build Logs

Check the Vercel build logs for detailed error information:
1. Go to your project dashboard
2. Click on the deployment
3. View the build logs for any errors

### Post-Deployment

After successful deployment:

1. Test all functionality
2. Verify database connections
3. Check API endpoints
4. Test authentication flows
5. Monitor performance and errors

### Custom Domain

To use a custom domain:

1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update your `NEXTAUTH_URL` environment variable
5. Redeploy if necessary

### Monitoring

Vercel provides built-in monitoring and analytics:
- Function execution logs
- Performance metrics
- Error tracking
- Real-time monitoring

## Authentication Flow

### Sign Up
- Users can register with their email, password, and name
- Supabase handles email verification (if enabled in your Supabase project settings)

### Sign In
- Users can sign in with their email and password
- Authentication state is managed through the Supabase client and React context

### Password Reset
- Users can request a password reset link
- The link will redirect them to the update password page

## Project Structure

- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/auth-context.tsx` - Authentication context provider
- `src/components/` - React components including UI components and pages
- `src/pages/` - Next.js pages including authentication and API routes
- `src/server/` - Server-side code including tRPC routers and database setup
- `src/stores/` - Zustand state management stores
- `src/services/` - Business logic and API services
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions and helpers
- `prisma/` - Database schema and migrations
- `vercel.json` - Vercel deployment configuration
- `scripts/` - Build and deployment scripts

## Environment Variables

### Development
- `DATABASE_URL` - SQLite database file path for development
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js
- `NEXTAUTH_URL` - Application URL for NextAuth.js
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase project anon/public key
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL
- `NEXT_PUBLIC_BACKEND_PATH` - Backend API path

### Production (Vercel)
See the [Vercel Deployment](#vercel-deployment) section for complete environment variable configuration.

## Supabase Configuration

For this application to work properly, you need to configure your Supabase project:

1. **Enable Email Auth Provider**:
   - Go to Authentication > Providers
   - Ensure Email provider is enabled
   - Configure any additional settings like requiring email confirmation

2. **Configure Email Templates** (optional):
   - Go to Authentication > Email Templates
   - Customize the templates for confirmation and password reset emails

3. **Set up Redirect URLs**:
   - Go to Authentication > URL Configuration
   - Add your application URL to the allowed redirect URLs (e.g., `http://localhost:5173`)

### Supbase Manual Setup

If you prefer to set up the database manually, you can run the SQL scripts in the Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration files in the `supbase/migrations` directory
4. Run the SQL commands in the SQL Editor

## Row Level Security (RLS)

The database is configured with Row Level Security to ensure that users can only access their own data:

- Users can only read their own quota
- Users can only update their own quota
- A trigger automatically creates a quota record for new users

## Automatic User Quota Creation

When a new user signs up, a trigger automatically creates a record in the `user_quotas` table with a default query count of 0.

## Technologies Used

- **Next.js 13** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Prisma** - Database ORM with PostgreSQL support
- **NextAuth.js** - Authentication library
- **Supabase** - Backend-as-a-Service
- **tRPC** - End-to-end typesafe APIs
- **Zustand** - State management
- **Stripe** - Payment processing
- **Vercel** - Deployment platform

## Additional Features

- **Agent System**: AI-powered task management and execution
- **Multi-language Support**: Internationalization with next-i18next
- **Payment Integration**: Stripe subscription management
- **OAuth Providers**: Google, GitHub, Discord authentication
- **Health Monitoring**: Built-in health check endpoints
- **Database Migrations**: Automated schema management
- **Type Safety**: Full TypeScript coverage with tRPC

## Troubleshooting

### Development Issues

If you encounter any issues with the database setup:

1. Check that your Supabase project is properly configured
2. Ensure that the SQL migrations have been applied correctly
3. Verify that the RLS policies are working as expected by testing with different user accounts

### Deployment Issues

For Vercel deployment issues, see the [Troubleshooting Deployment](#troubleshooting-deployment) section above.

### General Issues

1. **Database Connection**: Ensure your `DATABASE_URL` is correct
2. **Environment Variables**: Check that all required variables are set
3. **Build Errors**: Review the build logs for specific error messages
4. **TypeScript Errors**: The build ignores TypeScript errors, but check for critical issues 
