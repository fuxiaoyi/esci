import { supabase } from './supabase';

// Types
export interface UserAnnotation {
  id: string;
  user_id: string;
  question_id: number;
  answer: string;
  comments?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface AnnotationInput {
  question_id: number;
  answer: string;
  comments?: string;
}

/**
 * Save an annotation for a user
 * @param userId The user ID
 * @param annotation The annotation data
 * @returns The saved annotation or null if error
 */
export const saveUserAnnotation = async (
  userId: string, 
  annotation: AnnotationInput
): Promise<UserAnnotation | null> => {
  try {
    const { data, error } = await supabase
      .from('user_annotations')
      .upsert({
        user_id: userId,
        question_id: annotation.question_id,
        answer: annotation.answer,
        comments: annotation.comments || null,
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving user annotation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in saveUserAnnotation:', error);
    return null;
  }
};

/**
 * Get all annotations for a user
 * @param userId The user ID
 * @returns Array of user annotations
 */
export const getUserAnnotations = async (userId: string): Promise<UserAnnotation[]> => {
  try {
    const { data, error } = await supabase
      .from('user_annotations')
      .select('*')
      .eq('user_id', userId)
      .order('question_id', { ascending: true });

    if (error) {
      console.error('Error getting user annotations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserAnnotations:', error);
    return [];
  }
};

/**
 * Get a specific annotation for a user and question
 * @param userId The user ID
 * @param questionId The question ID
 * @returns The annotation or null if not found
 */
export const getUserAnnotation = async (
  userId: string, 
  questionId: number
): Promise<UserAnnotation | null> => {
  try {
    const { data, error } = await supabase
      .from('user_annotations')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - annotation doesn't exist
        return null;
      }
      console.error('Error getting user annotation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserAnnotation:', error);
    return null;
  }
};

/**
 * Delete an annotation for a user and question
 * @param userId The user ID
 * @param questionId The question ID
 * @returns True if successful, false otherwise
 */
export const deleteUserAnnotation = async (
  userId: string, 
  questionId: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_annotations')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId);

    if (error) {
      console.error('Error deleting user annotation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserAnnotation:', error);
    return false;
  }
};

/**
 * Get annotation statistics for a user
 * @param userId The user ID
 * @returns Object with annotation statistics
 */
export const getUserAnnotationStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_annotations')
      .select('question_id, answer, timestamp')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user annotation stats:', error);
      return {
        totalAnnotations: 0,
        answerDistribution: {},
        lastAnnotation: null
      };
    }

    const annotations = data || [];
    const answerDistribution = annotations.reduce((acc, annotation) => {
      acc[annotation.answer] = (acc[annotation.answer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lastAnnotation = annotations.length > 0 
      ? annotations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null;

    return {
      totalAnnotations: annotations.length,
      answerDistribution,
      lastAnnotation
    };
  } catch (error) {
    console.error('Error in getUserAnnotationStats:', error);
    return {
      totalAnnotations: 0,
      answerDistribution: {},
      lastAnnotation: null
    };
  }
}; 