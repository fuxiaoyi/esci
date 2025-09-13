import { supabase } from './supabase'
import { serverEnv } from '../env/schema.mjs'

export interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
  superAdmin?: boolean
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
}

export class SupabaseAuthService {
  private supabase = supabase

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signUpWithEmail(email: string, password: string, metadata?: { name?: string }) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signInWithOAuth(provider: 'google' | 'github' | 'discord', redirectTo?: string) {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${serverEnv.NEXTAUTH_URL}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession()
    
    if (error) {
      throw new Error(error.message)
    }

    return session
  }

  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    
    if (error) {
      throw new Error(error.message)
    }

    return user
  }

  async updateUser(updates: { name?: string; image?: string }) {
    const { data, error } = await this.supabase.auth.updateUser({
      data: updates,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${serverEnv.NEXTAUTH_URL}/auth/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async verifyOtp(email: string, token: string, type: 'signup' | 'recovery' | 'email') {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async resendOtp(email: string, type: 'signup') {
    const { data, error } = await this.supabase.auth.resend({
      type,
      email,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }
}

export const supabaseAuth = new SupabaseAuthService()
