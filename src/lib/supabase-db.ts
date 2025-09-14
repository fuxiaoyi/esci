import { supabase, supabaseAdmin } from './supabase'
import { serverEnv } from '../env/schema.mjs'

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

export class SupabaseDatabaseService {
  private supabase = supabase

  // User operations - These work with Supabase auth.users table
  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const { data, error } = await this.supabase.auth.admin.getUserByEmail(email)

    if (error || !data.user) return null

    const user = data.user
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

  async getUserById(id: string): Promise<DatabaseUser | null> {
    const { data, error } = await this.supabase.auth.admin.getUserById(id)

    if (error || !data.user) return null

    const user = data.user
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
    const { data, error } = await this.supabase.auth.admin.updateUserById(id, {
      user_metadata: {
        name: updates.name,
        avatar_url: updates.image,
        super_admin: updates.superAdmin,
        invite_code: updates.inviteCode,
      }
    })

    if (error) throw new Error(`Failed to update user: ${error.message}`)

    const user = data.user
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
    const { data, error } = await this.supabase
      .from('organization_users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .is('delete_date', null)

    if (error) throw new Error(`Failed to get user organizations: ${error.message}`)

    return data.map(row => ({
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
    
    const { data, error } = await supabaseAdmin
      .from('agents')
      .insert({
        user_id: agentData.userId,
        name: agentData.name,
        goal: agentData.goal
      })
      .select()
      .single()

    if (error) {
      console.error(`Error creating agent:`, error)
      throw new Error(`Failed to create agent: ${error.message}`)
    }

    console.log(`Successfully created agent: ${data.id}`)
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      goal: data.goal,
      deleteDate: data.delete_date ? new Date(data.delete_date) : undefined,
      createDate: new Date(data.create_date)
    }
  }

  async getAgentsByUserId(userId: string, limit: number = 20): Promise<Agent[]> {
    console.log(`Getting agents for user: ${userId}`)
    
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .is('delete_date', null)
      .order('create_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`Error fetching agents for user ${userId}:`, error)
      throw new Error(`Failed to get agents: ${error.message}`)
    }

    console.log(`Found ${data?.length || 0} agents for user ${userId}`)
    return data.map(agent => ({
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      goal: agent.goal,
      deleteDate: agent.delete_date ? new Date(agent.delete_date) : undefined,
      createDate: new Date(agent.create_date)
    }))
  }

  async getAllAgentsCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('agents')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting agents:', error)
      return 0
    }

    console.log(`Total agents in database: ${count || 0}`)
    return count || 0
  }

  async getAgentById(id: string): Promise<Agent & { tasks: AgentTask[] } | null> {
    console.log(`Looking for agent with ID: ${id}`)
    
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', id)
      .is('delete_date', null)
      .single()

    if (agentError) {
      console.error(`Error fetching agent ${id}:`, agentError)
      return null
    }
    
    if (!agent) {
      console.log(`No agent found with ID: ${id}`)
      return null
    }

    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('agent_tasks')
      .select('*')
      .eq('agent_id', id)
      .is('delete_date', null)
      .order('create_date', { ascending: true })

    if (tasksError) throw new Error(`Failed to get agent tasks: ${tasksError.message}`)

    return {
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      goal: agent.goal,
      deleteDate: agent.delete_date ? new Date(agent.delete_date) : undefined,
      createDate: new Date(agent.create_date),
      tasks: tasks.map(task => ({
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
    
    const { data, error } = await supabaseAdmin
      .from('agents')
      .update({
        name: updates.name,
        goal: updates.goal,
        delete_date: updates.deleteDate?.toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update agent: ${error.message}`)

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      goal: data.goal,
      deleteDate: data.delete_date ? new Date(data.delete_date) : undefined,
      createDate: new Date(data.create_date)
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
    
    const { data, error } = await supabaseAdmin
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

    if (error) {
      console.error(`Error creating agent tasks:`, error)
      throw new Error(`Failed to create agent tasks: ${error.message}`)
    }

    console.log(`Successfully created ${data.length} agent tasks`)
    return data.map(task => ({
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
    const { data, error } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      code: data.code,
      status: data.status,
      createDate: data.create_date ? new Date(data.create_date) : undefined
    }
  }

  async updateInvitationStatus(id: string, status: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('invitations')
      .update({ status })
      .eq('id', id)

    if (error) throw new Error(`Failed to update invitation: ${error.message}`)
  }

  async createInvitation(code: string): Promise<Invitation> {
    const { data, error } = await supabaseAdmin
      .from('invitations')
      .insert({ code })
      .select()
      .single()

    if (error) throw new Error(`Failed to create invitation: ${error.message}`)

    return {
      id: data.id,
      code: data.code,
      status: data.status,
      createDate: data.create_date ? new Date(data.create_date) : undefined
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

    const { data, error, count } = await query
      .order('create_date', { ascending: false })
      .range((pageNum - 1) * pageSize, pageNum * pageSize - 1)

    if (error) throw new Error(`Failed to get invitations: ${error.message}`)

    const list = (data || []).map(item => ({
      id: item.id,
      code: item.code,
      status: item.status,
      createDate: item.create_date ? new Date(item.create_date) : undefined
    }))

    return {
      list,
      total: count || 0,
      pageNum,
      pageSize
    }
  }
}

export const supabaseDb = new SupabaseDatabaseService()
