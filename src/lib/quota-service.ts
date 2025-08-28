import { supabase } from './supabase';

// Constants
export const QUERY_LIMIT = 10;

// Types
export interface UserQuota {
  id: string;
  user_id: string;
  query_count: number;
  updated_at: string;
}

/**
 * Get the current query count for a user
 * @param userId The user ID to get the quota for
 * @returns The current query count or 0 if not found
 */
export const getUserQueryCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_quotas')
      .select('query_count')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user quota:', error);
      return 0;
    }
    
    return data?.query_count || 0;
  } catch (error) {
    console.error('Error in getUserQueryCount:', error);
    return 0;
  }
};

/**
 * Increment the query count for a user
 * @param userId The user ID to increment the quota for
 * @returns The new query count
 */
export const incrementUserQueryCount = async (userId: string): Promise<number> => {
  try {
    // First check if the user has a quota record
    const { data: existingQuota } = await supabase
      .from('user_quotas')
      .select('query_count')
      .eq('user_id', userId)
      .single();
    
    if (existingQuota) {
      // Update existing record
      const newCount = (existingQuota.query_count || 0) + 1;
      
      const { error } = await supabase
        .from('user_quotas')
        .update({ query_count: newCount, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating user quota:', error);
        return existingQuota.query_count || 0;
      }
      
      return newCount;
    } else {
      // Create new record
      const { error } = await supabase
        .from('user_quotas')
        .insert({
          user_id: userId,
          query_count: 1,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating user quota:', error);
        return 0;
      }
      
      return 1;
    }
  } catch (error) {
    console.error('Error in incrementUserQueryCount:', error);
    return 0;
  }
};

/**
 * Reset the query count for a user
 * @param userId The user ID to reset the quota for
 */
export const resetUserQueryCount = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_quotas')
      .update({ query_count: 0, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error resetting user quota:', error);
    }
  } catch (error) {
    console.error('Error in resetUserQueryCount:', error);
  }
}; 