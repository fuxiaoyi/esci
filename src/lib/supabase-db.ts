import { supabase, supabaseAdmin } from './supabase'

export interface DatabaseUser {
  id: string
  email: string
  name?: string
  image?: string
  superAdmin?: boolean
  inviteCode?: string
  emailVerified?: Date
  createDate: Date
}

export interface Organization {
  id: string
  name: string
  createdBy: string
  createDate: Date
  updateDate?: Date
  deleteDate?: Date
}

export interface OrganizationUser {
  id: string
  userId: string
  organizationId: string
  role: string
  createDate: Date
  updateDate?: Date
  deleteDate?: Date
}

export interface Agent {
  id: string
  userId: string
  name: string
  goal: string
  deleteDate?: Date
  createDate: Date
}

export interface AgentTask {
  id: string
  agentId: string
  type: string
  status?: string
  value: string
  info?: string
  sort: number
  deleteDate?: Date
  createDate: Date
}

export interface Invitation {
  id: string
  code?: string
  status?: string
  createDate?: Date
}

// Database row types for Supabase responses
interface OrganizationUserRow {
  id: string
  user_id: string
  organization_id: string
  role: string
  create_date: string
  update_date?: string
  delete_date?: string
}

interface AgentRow {
  id: string
  user_id: string
  name: string
  goal: string
  create_date: string
  delete_date?: string
}

interface AgentTaskRow {
  id: string
  agent_id: string
  type: string
  status?: string
  value: string
  info?: string
  sort: number
  create_date: string
  delete_date?: string
}

interface InvitationRow {
  id: string
  code?: string
  status?: string
  create_date?: string
}

export class SupabaseDatabaseService {
  private supabase = supabase

  // User operations - These work with Supabase auth.users table
  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const response = await this.supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })

    if (response.error || !response.data?.users) return null
    
    const user = response.data.users.find(u => u.email === email)
    if (!user) return null
    
    const typedUser = user as {
      id: string;
      email?: string;
      user_metadata?: {
        name?: string;
        avatar_url?: string;
        super_admin?: boolean;
        invite_code?: string;
      };
      email_confirmed_at?: string;
      created_at: string;
    }
    return {
      id: typedUser.id,
      email: typedUser.email || '',
      name: typedUser.user_metadata?.name || typedUser.email || '',
      image: typedUser.user_metadata?.avatar_url,
      superAdmin: typedUser.user_metadata?.super_admin || false,
      inviteCode: typedUser.user_metadata?.invite_code,
      emailVerified: typedUser.email_confirmed_at ? new Date(typedUser.email_confirmed_at) : undefined,
      createDate: new Date(typedUser.created_at)
    }
  }

  async getUserById(id: string): Promise<DatabaseUser | null> {
    const response = await this.supabase.auth.admin.getUserById(id)

    if (response.error || !response.data?.user) return null

    const user = response.data.user as {
      id: string;
      email?: string;
      user_metadata?: {
        name?: string;
        avatar_url?: string;
        super_admin?: boolean;
        invite_code?: string;
      };
      email_confirmed_at?: string;
      created_at: string;
    }
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email || '',
      image: user.user_metadata?.avatar_url,
      superAdmin: user.user_metadata?.super_admin || false,
      inviteCode: user.user_metadata?.invite_code,
      emailVerified: user.email_confirmed_at ? new Date(user.email_confirmed_at) : undefined,
      createDate: new Date(user.created_at)
    }
  }

  async createUser(userData: {
    email: string
    name?: string
    image?: string
    superAdmin?: boolean
    inviteCode?: string
    emailVerified?: Date
  }): Promise<DatabaseUser> {
    // For Supabase auth, we don't create users directly in the database
    // Users are created through Supabase Auth signup process
    // This method is mainly for compatibility with the existing code
    const user = await this.getUserByEmail(userData.email)
    if (user) {
      return user
    }
    
    throw new Error('User creation should be handled through Supabase Auth signup process')
  }

  async updateUser(id: string, updates: Partial<DatabaseUser>): Promise<DatabaseUser> {
    const response = await this.supabase.auth.admin.updateUserById(id, {
      user_metadata: {
        name: updates.name,
        avatar_url: updates.image,
        super_admin: updates.superAdmin,
        invite_code: updates.inviteCode,
      }
    })

    if (response.error) throw new Error(`Failed to update user: ${response.error.message}`)

    const user = response.data.user as {
      id: string;
      email?: string;
      user_metadata?: {
        name?: string;
        avatar_url?: string;
        super_admin?: boolean;
        invite_code?: string;
      };
      email_confirmed_at?: string;
      created_at: string;
    }
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email || '',
      image: user.user_metadata?.avatar_url,
      superAdmin: user.user_metadata?.super_admin || false,
      inviteCode: user.user_metadata?.invite_code,
      emailVerified: user.email_confirmed_at ? new Date(user.email_confirmed_at) : undefined,
      createDate: new Date(user.created_at)
    }
  }

  // Organization operations
  async getUserOrganizations(userId: string): Promise<OrganizationUser[]> {
    const response = await this.supabase
      .from('organization_users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .is('delete_date', null)

    if (response.error) throw new Error(`Failed to get user organizations: ${response.error.message}`)

    const typedData = response.data as OrganizationUserRow[]
    return typedData.map((row: OrganizationUserRow) => ({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      role: row.role,
      createDate: new Date(row.create_date),
      updateDate: row.update_date ? new Date(row.update_date) : undefined,
      deleteDate: row.delete_date ? new Date(row.delete_date) : undefined
    }))
  }

  // Agent operations
  async createAgent(agentData: {
    userId: string
    name: string
    goal: string
  }): Promise<Agent> {
    console.log(`Creating agent for user: ${agentData.userId}`)
    
    const response = await supabaseAdmin
      .from('agents')
      .insert({
        user_id: agentData.userId,
        name: agentData.name,
        goal: agentData.goal
      })
      .select()
      .single()

    if (response.error) {
      console.error(`Error creating agent:`, response.error)
      throw new Error(`Failed to create agent: ${response.error.message}`)
    }

    const agentRow = response.data as AgentRow
    console.log(`Successfully created agent: ${agentRow.id}`)
    return {
      id: agentRow.id,
      userId: agentRow.user_id,
      name: agentRow.name,
      goal: agentRow.goal,
      deleteDate: agentRow.delete_date ? new Date(agentRow.delete_date) : undefined,
      createDate: new Date(agentRow.create_date)
    }
  }

  async getAgentsByUserId(userId: string, limit: number = 20): Promise<Agent[]> {
    console.log(`Getting agents for user: ${userId}`)
    
    const response = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .is('delete_date', null)
      .order('create_date', { ascending: false })
      .limit(limit)

    if (response.error) {
      console.error(`Error fetching agents for user ${userId}:`, response.error)
      throw new Error(`Failed to get agents: ${response.error.message}`)
    }

    console.log(`Found ${response.data?.length || 0} agents for user ${userId}`)
    const typedData = response.data as AgentRow[]
    return typedData.map((agent: AgentRow) => ({
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      goal: agent.goal,
      deleteDate: agent.delete_date ? new Date(agent.delete_date) : undefined,
      createDate: new Date(agent.create_date)
    }))
  }

  async getAllAgentsCount(): Promise<number> {
    const response = await supabaseAdmin
      .from('agents')
      .select('*', { count: 'exact', head: true })

    if (response.error) {
      console.error('Error counting agents:', response.error)
      return 0
    }

    console.log(`Total agents in database: ${response.count || 0}`)
    return response.count || 0
  }

  async getAgentById(id: string): Promise<Agent & { tasks: AgentTask[] } | null> {
    console.log(`Looking for agent with ID: ${id}`)
    
    const agentResponse = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', id)
      .is('delete_date', null)
      .single()

    if (agentResponse.error) {
      console.error(`Error fetching agent ${id}:`, agentResponse.error)
      return null
    }
    
    if (!agentResponse.data) {
      console.log(`No agent found with ID: ${id}`)
      return null
    }

    const agent = agentResponse.data as AgentRow

    const tasksResponse = await supabaseAdmin
      .from('agent_tasks')
      .select('*')
      .eq('agent_id', id)
      .is('delete_date', null)
      .order('create_date', { ascending: true })

    if (tasksResponse.error) throw new Error(`Failed to get agent tasks: ${tasksResponse.error.message}`)

    const typedTasks = tasksResponse.data as AgentTaskRow[]
    return {
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      goal: agent.goal,
      deleteDate: agent.delete_date ? new Date(agent.delete_date) : undefined,
      createDate: new Date(agent.create_date),
      tasks: typedTasks.map((task: AgentTaskRow) => ({
        id: task.id,
        agentId: task.agent_id,
        type: task.type,
        status: task.status,
        value: task.value,
        info: task.info,
        sort: task.sort,
        deleteDate: task.delete_date ? new Date(task.delete_date) : undefined,
        createDate: new Date(task.create_date)
      }))
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    console.log(`Updating agent ${id} with updates:`, updates)
    
    const response = await supabaseAdmin
      .from('agents')
      .update({
        name: updates.name,
        goal: updates.goal,
        delete_date: updates.deleteDate?.toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (response.error) throw new Error(`Failed to update agent: ${response.error.message}`)

    const agentData = response.data as AgentRow
    return {
      id: agentData.id,
      userId: agentData.user_id,
      name: agentData.name,
      goal: agentData.goal,
      deleteDate: agentData.delete_date ? new Date(agentData.delete_date) : undefined,
      createDate: new Date(agentData.create_date)
    }
  }

  async createAgentTasks(tasks: Array<{
    agentId: string
    type: string
    status?: string
    value: string
    info?: string
    sort: number
  }>): Promise<AgentTask[]> {
    console.log(`Creating ${tasks.length} agent tasks`)
    
    const response = await supabaseAdmin
      .from('agent_tasks')
      .insert(tasks.map(task => ({
        agent_id: task.agentId,
        type: task.type,
        status: task.status,
        value: task.value,
        info: task.info,
        sort: task.sort
      })))
      .select()

    if (response.error) {
      console.error(`Error creating agent tasks:`, response.error)
      throw new Error(`Failed to create agent tasks: ${response.error.message}`)
    }

    console.log(`Successfully created ${response.data.length} agent tasks`)
    const typedData = response.data as AgentTaskRow[]
    return typedData.map((task: AgentTaskRow) => ({
      id: task.id,
      agentId: task.agent_id,
      type: task.type,
      status: task.status,
      value: task.value,
      info: task.info,
      sort: task.sort,
      deleteDate: task.delete_date ? new Date(task.delete_date) : undefined,
      createDate: new Date(task.create_date)
    }))
  }

  // Invitation operations
  async getInvitationByCode(code: string): Promise<Invitation | null> {
    const response = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('code', code)
      .single()

    if (response.error || !response.data) return null

    const invitationData = response.data as InvitationRow
    return {
      id: invitationData.id,
      code: invitationData.code,
      status: invitationData.status,
      createDate: invitationData.create_date ? new Date(invitationData.create_date) : undefined
    }
  }

  async updateInvitationStatus(id: string, status: string): Promise<void> {
    const response = await supabaseAdmin
      .from('invitations')
      .update({ status })
      .eq('id', id)

    if (response.error) throw new Error(`Failed to update invitation: ${response.error.message}`)
  }

  async createInvitation(code: string): Promise<Invitation> {
    const response = await supabaseAdmin
      .from('invitations')
      .insert({ code })
      .select()
      .single()

    if (response.error) throw new Error(`Failed to create invitation: ${response.error.message}`)

    const invitationData = response.data as InvitationRow
    return {
      id: invitationData.id,
      code: invitationData.code,
      status: invitationData.status,
      createDate: invitationData.create_date ? new Date(invitationData.create_date) : undefined
    }
  }

  async getInvitations(pageNum: number = 1, pageSize: number = 10, status?: string): Promise<{
    list: Invitation[]
    total: number
    pageNum: number
    pageSize: number
  }> {
    let query = supabaseAdmin
      .from('invitations')
      .select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    const response = await query
      .order('create_date', { ascending: false })
      .range((pageNum - 1) * pageSize, pageNum * pageSize - 1)

    if (response.error) throw new Error(`Failed to get invitations: ${response.error.message}`)

    const typedData = response.data as InvitationRow[]
    const list = (typedData || []).map((item: InvitationRow) => ({
      id: item.id,
      code: item.code,
      status: item.status,
      createDate: item.create_date ? new Date(item.create_date) : undefined
    }))

    return {
      list,
      total: response.count || 0,
      pageNum,
      pageSize
    }
  }
}

export const supabaseDb = new SupabaseDatabaseService()
