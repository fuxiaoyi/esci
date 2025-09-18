-- Fix infinite recursion in organization_users RLS policies
-- This migration fixes the circular dependency in the RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read their own organization memberships" ON public.organization_users;
DROP POLICY IF EXISTS "Users can read organization memberships for their organizations" ON public.organization_users;
DROP POLICY IF EXISTS "Users can create organization memberships" ON public.organization_users;
DROP POLICY IF EXISTS "Users can update their own organization memberships" ON public.organization_users;

-- Create simplified, non-recursive policies for organization_users
-- Users can read their own organization memberships
CREATE POLICY "Users can read their own organization memberships" ON public.organization_users
  FOR SELECT USING (user_id = auth.uid() AND delete_date IS NULL);

-- Users can create organization memberships (for themselves)
CREATE POLICY "Users can create organization memberships" ON public.organization_users
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own organization memberships
CREATE POLICY "Users can update their own organization memberships" ON public.organization_users
  FOR UPDATE USING (user_id = auth.uid() AND delete_date IS NULL);

-- Users can delete their own organization memberships (soft delete)
CREATE POLICY "Users can delete their own organization memberships" ON public.organization_users
  FOR UPDATE USING (user_id = auth.uid() AND delete_date IS NULL);

-- Service role can manage all organization memberships
CREATE POLICY "Service role can manage organization memberships" ON public.organization_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Also fix the organizations policies to prevent recursion
DROP POLICY IF EXISTS "Users can read organizations they belong to" ON public.organizations;

-- Create a simpler policy for organizations that doesn't cause recursion
CREATE POLICY "Users can read organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND delete_date IS NULL
    )
  );

-- Add a policy to allow reading organization details for organization members
-- This is needed for the join query in getUserOrganizations
CREATE POLICY "Users can read organization details for their memberships" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND delete_date IS NULL
    )
  );
