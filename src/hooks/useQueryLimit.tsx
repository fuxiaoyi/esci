import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  QUERY_LIMIT, 
  getUserQueryCount, 
  incrementUserQueryCount, 
  resetUserQueryCount 
} from '@/lib/quota-service';

// Keep localStorage for non-authenticated users
const LOCAL_STORAGE_KEY = 'internta-query-count';

export const useQueryLimit = () => {
  const [queryCount, setQueryCount] = useState<number>(0);
  const [limitExceeded, setLimitExceeded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has an active subscription
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsSubscribed(false);
        return;
      }
      
      try {
        // Get subscription status from the database
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('is_subscribed')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription status:', error);
          setIsSubscribed(false);
          return;
        }
        
        setIsSubscribed(data?.is_subscribed || false);
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setIsSubscribed(false);
      }
    };
    
    checkSubscriptionStatus();
  }, [user]);

  // Load query count on initial render and when user changes
  useEffect(() => {
    const loadQueryCount = async () => {
      setIsLoading(true);
      
      try {
        // If user is subscribed, they have unlimited queries
        if (isSubscribed) {
          setQueryCount(0);
          setLimitExceeded(false);
          setIsLoading(false);
          return;
        }
        
        if (user) {
          // Authenticated user - get count from Supabase
          const count = await getUserQueryCount(user.id);
          setQueryCount(count);
          setLimitExceeded(count >= QUERY_LIMIT);
        } else {
          // Non-authenticated user - get count from localStorage
          const storedCount = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (storedCount) {
            const count = parseInt(storedCount, 10);
            setQueryCount(count);
            setLimitExceeded(count >= QUERY_LIMIT);
          }
        }
      } catch (error) {
        console.error('Error loading query count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQueryCount();
  }, [user, isSubscribed]);

  // Increment query count
  const incrementQueryCount = async () => {
    try {
      // If user is subscribed, they have unlimited queries
      if (isSubscribed) {
        return false; // No limit exceeded
      }
      
      let newCount: number;
      
      if (user) {
        // Authenticated user - increment in Supabase
        newCount = await incrementUserQueryCount(user.id);
      } else {
        // Non-authenticated user - increment in localStorage
        newCount = queryCount + 1;
        localStorage.setItem(LOCAL_STORAGE_KEY, newCount.toString());
      }
      
      setQueryCount(newCount);
      
      // Check if limit is now exceeded
      if (newCount === QUERY_LIMIT) {
        setLimitExceeded(true);
        toast({
          title: "Query Limit Reached",
          description: "You've reached your free query limit. Please subscribe to continue.",
          variant: "destructive",
        });
      }
      
      // Show warning when approaching limit
      if (newCount === QUERY_LIMIT - 1) {
        toast({
          title: "Almost at Query Limit",
          description: `You have 1 free query remaining.`,
          variant: "default",
        });
      }
      
      return newCount >= QUERY_LIMIT;
    } catch (error) {
      console.error('Error incrementing query count:', error);
      return false;
    }
  };

  // Reset query count (to be used after payment)
  const resetQueryCount = async () => {
    try {
      if (user) {
        // Authenticated user - reset in Supabase
        await resetUserQueryCount(user.id);
      } else {
        // Non-authenticated user - reset in localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, '0');
      }
      
      setQueryCount(0);
      setLimitExceeded(false);
    } catch (error) {
      console.error('Error resetting query count:', error);
    }
  };

  return {
    queryCount,
    limitExceeded,
    incrementQueryCount,
    resetQueryCount,
    isLoading,
    isSubscribed,
  };
};
