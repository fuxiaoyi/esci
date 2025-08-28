# Edge Science - React Application with Supabase Authentication

This project is a React application that uses Supabase for authentication and user management.

## Features

- User registration and authentication with Supabase
- Protected routes for authenticated users
- Password reset functionality
- Modern UI with Tailwind CSS and Shadcn UI components

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account and project

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

4. Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

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
- `src/components/ProtectedRoute.tsx` - Component for protecting routes that require authentication
- `src/pages/` - Application pages including authentication pages

## Environment Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase project anon/public key

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

## Troubleshooting

If you encounter any issues with the database setup:

1. Check that your Supabase project is properly configured
2. Ensure that the SQL migrations have been applied correctly
3. Verify that the RLS policies are working as expected by testing with different user accounts 
