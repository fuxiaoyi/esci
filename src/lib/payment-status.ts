import { supabase } from './supabase';

/**
 * Status of the payment system
 */
export interface PaymentSystemStatus {
  isAvailable: boolean;
  lastChecked: Date;
  message: string;
}

// Cache the status to avoid too many checks
let cachedStatus: PaymentSystemStatus | null = null;
let statusCheckPromise: Promise<PaymentSystemStatus> | null = null;

/**
 * Check if the payment system is available
 * This performs a lightweight check to see if the Stripe integration is working
 * @returns The status of the payment system
 */
export const checkPaymentSystemStatus = async (): Promise<PaymentSystemStatus> => {
  // If we already have a check in progress, return that promise
  if (statusCheckPromise) {
    return statusCheckPromise;
  }
  
  // If we have a cached status that's less than 5 minutes old, return it
  if (cachedStatus && (new Date().getTime() - cachedStatus.lastChecked.getTime() < 5 * 60 * 1000)) {
    return cachedStatus;
  }
  
  // Create a new promise for the status check
  statusCheckPromise = new Promise<PaymentSystemStatus>(async (resolve) => {
    try {
      // Check internet connectivity first
      if (!navigator.onLine) {
        const status: PaymentSystemStatus = {
          isAvailable: false,
          lastChecked: new Date(),
          message: "No internet connection. Please check your network and try again."
        };
        cachedStatus = status;
        resolve(status);
        return;
      }
      
      // Get the user's session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        console.error('No authentication token available');
        const status: PaymentSystemStatus = {
          isAvailable: false,
          lastChecked: new Date(),
          message: "Authentication required to check payment system status"
        };
        cachedStatus = status;
        resolve(status);
        return;
      }

      // Call the Supabase function using fetch with GET method instead of invoke
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment-status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        console.error('Error checking payment system status:', await response.text());
        const status: PaymentSystemStatus = {
          isAvailable: false,
          lastChecked: new Date(),
          message: `Payment system may be unavailable: ${response.statusText || 'Unknown error'}`
        };
        cachedStatus = status;
        resolve(status);
        return;
      }
      
      const data = await response.json();
      
      // Check if the response has the expected structure
      // The Edge Function returns is_subscribed instead of available
      if (!data || (typeof data.is_subscribed !== 'boolean')) {
        const status: PaymentSystemStatus = {
          isAvailable: false,
          lastChecked: new Date(),
          message: "Invalid response from payment system status check"
        };
        cachedStatus = status;
        resolve(status);
        return;
      }
      
      // Use available if it exists, otherwise use is_subscribed
      const isAvailable = typeof data.is_subscribed === 'boolean';

      const status: PaymentSystemStatus = {
        isAvailable: isAvailable,
        lastChecked: new Date(),
        message: data.message || (isAvailable ? "Payment system is available" : "Payment system is currently unavailable")
      };
      
      cachedStatus = status;
      resolve(status);
    } catch (error) {
      console.error('Error in checkPaymentSystemStatus:', error);
      const status: PaymentSystemStatus = {
        isAvailable: false,
        lastChecked: new Date(),
        message: `Error checking payment system: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      cachedStatus = status;
      resolve(status);
    } finally {
      // Clear the promise so future calls can create a new one
      setTimeout(() => {
        statusCheckPromise = null;
      }, 100);
    }
  });
  
  return statusCheckPromise;
};

/**
 * Get the estimated time until the payment system is back online
 * This is just a placeholder - in a real implementation, you would get this from your backend
 * @returns Estimated time in minutes, or null if unknown
 */
export const getEstimatedRecoveryTime = async (): Promise<number | null> => {
  try {
    // Get the user's session for authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      console.error('No authentication token available');
      return null;
    }

    // Call the Supabase function using fetch with GET method instead of invoke
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-payment-recovery-time`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Error fetching recovery time:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.estimated_recovery_minutes || null;
  } catch (error) {
    console.error('Error getting estimated recovery time:', error);
    return null;
  }
}; 