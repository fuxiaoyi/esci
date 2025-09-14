-- Migration to replace Prisma SQLite with Supabase PostgreSQL
-- This migration creates all necessary tables to replace the Prisma schema

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  status TEXT DEFAULT 'unUse',
  create_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  create_date TIMESTAMPTZ DEFAULT NOW(),
  update_date TIMESTAMPTZ,
  delete_date TIMESTAMPTZ
);

-- Create organization_users table (junction table)
CREATE TABLE IF NOT EXISTS public.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  create_date TIMESTAMPTZ DEFAULT NOW(),
  update_date TIMESTAMPTZ,
  delete_date TIMESTAMPTZ,
  UNIQUE(user_id, organization_id)
);

-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  delete_date TIMESTAMPTZ,
  create_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_tasks table
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT,
  value TEXT NOT NULL,
  info TEXT,
  sort INTEGER DEFAULT 0,
  delete_date TIMESTAMPTZ,
  create_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create runs table
CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  create_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create new_runs table (agent_run)
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  create_date TIMESTAMPTZ DEFAULT NOW(),
  goal TEXT NOT NULL
);

-- Create tasks table (agent_task)
CREATE TABLE IF NOT EXISTS public.agent_tasks_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  create_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create oauth_credentials table
CREATE TABLE IF NOT EXISTS public.oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  state TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  token_type TEXT,
  access_token_enc TEXT,
  access_token_expiration TIMESTAMPTZ,
  refresh_token_enc TEXT,
  scope TEXT,
  create_date TIMESTAMPTZ DEFAULT NOW(),
  update_date TIMESTAMPTZ,
  delete_date TIMESTAMPTZ
);

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_organization_id ON public.organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_create_date ON public.agents(create_date);
CREATE INDEX IF NOT EXISTS idx_agents_user_delete_create ON public.agents(user_id, delete_date, create_date);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON public.agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON public.agent_tasks(type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_create_date ON public.agent_tasks(create_date);
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_user_create ON public.runs(user_id, create_date);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_create ON public.agent_runs(user_id, create_date);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_new_run_id ON public.agent_tasks_new(run_id);
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_state ON public.oauth_credentials(state);
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_id ON public.oauth_credentials(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invitations (admin only)
CREATE POLICY "Service role can manage invitations" ON public.invitations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create RLS policies for organizations
CREATE POLICY "Users can read organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND delete_date IS NULL
    )
  );

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update organizations they created" ON public.organizations
  FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for organization_users
CREATE POLICY "Users can read their own organization memberships" ON public.organization_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read organization memberships for their organizations" ON public.organization_users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND delete_date IS NULL
    )
  );

CREATE POLICY "Users can create organization memberships" ON public.organization_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization memberships" ON public.organization_users
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for agents
CREATE POLICY "Users can manage their own agents" ON public.agents
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for agent_tasks
CREATE POLICY "Users can manage tasks for their agents" ON public.agent_tasks
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for runs
CREATE POLICY "Users can manage their own runs" ON public.runs
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for agent_runs
CREATE POLICY "Users can manage their own agent runs" ON public.agent_runs
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for agent_tasks_new
CREATE POLICY "Users can manage tasks for their agent runs" ON public.agent_tasks_new
  FOR ALL USING (
    run_id IN (
      SELECT id FROM public.agent_runs WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for oauth_credentials
CREATE POLICY "Users can manage their own oauth credentials" ON public.oauth_credentials
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for verification_tokens (service role only)
CREATE POLICY "Service role can manage verification tokens" ON public.verification_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_tasks_new TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oauth_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_tokens TO service_role;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_users_updated_at
  BEFORE UPDATE ON public.organization_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oauth_credentials_updated_at
  BEFORE UPDATE ON public.oauth_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
