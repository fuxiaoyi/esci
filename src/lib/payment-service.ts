import { supabase } from './supabase';

// Custom error class for payment errors
export class PaymentError extends Error {
  code: string;
  details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Checks if Supabase Edge Functions are available
 * @returns True if Edge Functions are available, false otherwise
 */
export const checkEdgeFunctionsAvailability = async (): Promise<boolean> => {
  try {
    // Try to invoke a simple function to check if Edge Functions are available
    const { error } = await supabase.functions.invoke('check-payment-status', {
      method: 'GET',
    });
    
    // If there's no error or the error is related to authentication, Edge Functions are available
    return !error || error.message.includes('JWT');
  } catch (error) {
    console.error('Error checking Edge Functions availability:', error);
    return false;
  }
};

/**
 * Creates a Stripe checkout session for premium subscription
 * @returns The checkout URL to redirect the user to
 */
export const createCheckoutSession = async (): Promise<string> => {
  // Check if Edge Functions are available
  const edgeFunctionsAvailable = await checkEdgeFunctionsAvailability();
  if (!edgeFunctionsAvailable) {
    throw new PaymentError(
      'Payment system is currently unavailable. Please try again later.',
      'edge_functions_unavailable'
    );
  }
  
  // Call the Supabase function that creates a Stripe checkout session
  try {
    console.log('Calling create-checkout-session function...');
    
    // Add a timeout to the function call
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new PaymentError(
          'Request timed out. Please try again later.',
          'request_timeout'
        ));
      }, 15000); // 15 second timeout (increased from 10 seconds)
    });
    
    // Get the JWT token from the current session
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new PaymentError(
        'You must be logged in to make a payment.',
        'authentication_required'
      );
    }
    
    // Log the request details (without sensitive information)
    console.log('Request details:', {
      url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
      method: 'POST',
      hasToken: !!token,
      hasApiKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      body: {
        price: import.meta.env.VITE_STRIPE_PRICE_ID, // Read from env or fallback to default
        success_url: `${import.meta.env.VITE_APP_URL}/personal?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${import.meta.env.VITE_APP_URL}/payment-cancel`,
      }
    });
    
    // Create the function call promise with Supabase invoke method
    const functionCallPromise = supabase.functions.invoke('create-checkout-session', {
      method: 'POST',
      body: {
        price: import.meta.env.VITE_STRIPE_PRICE_ID, // Read from env or fallback to default
        success_url: `${import.meta.env.VITE_APP_URL}/personal?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${import.meta.env.VITE_APP_URL}/payment-cancel`,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      }
    });
    
    // Race the function call against the timeout
    const result = await Promise.race([
      functionCallPromise,
      timeoutPromise
    ]);
    
    // Check if the result is from the timeout promise (which would be a PaymentError)
    if (result instanceof PaymentError) {
      throw result;
    }
    
    // Now we know it's from the function call promise
    const { data, error } = result;
    
    if (error) {
      console.error('Error response from create-checkout-session:', error);
      
      // Extract error details
      const errorDetails = error.message || '';
      const errorData = error.details || null;
      const status = error.status || 500;
      
      if (status === 500) {
        // Check if it's a missing environment variables error
        if (errorDetails.includes('environment variables')) {
          throw new PaymentError(
            'Payment system configuration error. Please contact support with error code: ENV_CONFIG',
            'config_error',
            { status, details: errorDetails, data: errorData }
          );
        }
        
        throw new PaymentError(
          `Server error: ${errorDetails || 'Internal server error'}`,
          'server_error',
          { status, details: errorDetails, data: errorData }
        );
      } else if (status === 401) {
        throw new PaymentError(
          'Authentication error. Please try signing out and back in.',
          'authentication_error',
          { status, details: errorDetails, data: errorData }
        );
      } else if (status === 400) {
        // Check if it's a price ID error
        if (errorDetails.includes('price')) {
          throw new PaymentError(
            `Invalid price ID: ${errorDetails}`,
            'invalid_price',
            { status, details: errorDetails, data: errorData }
          );
        } else {
          throw new PaymentError(
            `Invalid request: ${errorDetails}`,
            'invalid_request',
            { status, details: errorDetails, data: errorData }
          );
        }
      } else {
        throw new PaymentError(
          `Error from payment service: ${errorDetails}`,
          'service_error',
          { status, details: errorDetails, data: errorData }
        );
      }
    }
    
    if (!data || !data.url) {
      console.error('Invalid response from create-checkout-session:', data);
      throw new PaymentError(
        'Invalid response from payment service: missing checkout URL',
        'invalid_checkout_response',
        data
      );
    }
    
    return data.url;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Check if it's a network error
    if (error.message && error.message.includes('net::ERR_FAILED')) {
      // Try a direct fetch to test connectivity to the Supabase project
      try {
        // Get the Supabase URL from environment variables instead of the client
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        console.log('Testing connectivity to Supabase:', supabaseUrl);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/health-check`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(e => {
          console.error('Fetch test failed:', e);
          return null;
        });
        
        console.log('Connectivity test result:', response?.status || 'Failed');
        
        if (response && response.ok) {
          const healthData = await response.json();
          console.log('Health check data:', healthData);
        }
      } catch (testError) {
        console.error('Error testing connectivity:', testError);
      }
      
      throw new PaymentError(
        'Network error connecting to payment service. Please check your internet connection and try again.',
        'network_error',
        error
      );
    }
    
    // If it's already a PaymentError, just rethrow it
    if (error instanceof PaymentError) {
      throw error;
    }
    
    // Otherwise, wrap it in a PaymentError
    throw new PaymentError(
      'Failed to create checkout session',
      'checkout_creation_failed',
      error
    );
  }
};

/**
 * Verifies a Stripe payment session
 * @param sessionId The Stripe session ID to verify
 * @returns Whether the payment was successful
 */
export const verifyPaymentSession = async (sessionId: string): Promise<boolean> => {
  try {
    if (!sessionId) {
      throw new PaymentError(
        'No session ID provided for verification',
        'missing_session_id'
      );
    }
    
    // Get the current user and session
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();
    
    const token = sessionData.session?.access_token;
    const user = userData.user;
    
    if (!token || !user) {
      throw new PaymentError(
        'You must be logged in to verify a payment.',
        'authentication_required'
      );
    }
    
    // Get the necessary information for the direct fetch
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Verifying payment session:', {
      sessionId: sessionId.substring(0, 5) + '...' // Log only part of the session ID for security
    });
    
    try {
      // First attempt: Try using the Edge Function
      console.log('Attempting to verify payment via Edge Function...');
      
      // Use Supabase invoke method with the correct headers
      const { data, error } = await supabase.functions.invoke('verify-payment-session', {
        method: 'POST',
        body: { session_id: sessionId },
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        }
      });
      
      if (error) {
        console.error('Error invoking Edge Function:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      console.log('Verification response:', data);
      
      if (!data || typeof data.success !== 'boolean') {
        throw new Error('Invalid response format');
      }
      
      return data.success;
    } catch (edgeFunctionError) {
      // Edge Function approach failed, try fallback approach
      console.error('Edge Function verification failed:', edgeFunctionError);
      console.log('Attempting fallback verification approach...');
      
      // Fallback: Check if the user is already subscribed in the database
      try {
        // Check the user's subscription status in the database
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('is_subscribed')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error checking subscription status:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        if (data?.is_subscribed) {
          console.log('User is already subscribed according to database');
          return true;
        }
        
        // If we get here, we need to try another approach
        // Try to call our update-subscription Edge Function
        console.log('Attempting to update subscription via Edge Function...');
        
        try {
          // Try using invoke first for update-subscription
          console.log('Attempting to update subscription via Supabase invoke...');
          try {
            const { data: updateData, error: updateError } = await supabase.functions.invoke('update-subscription', {
              method: 'POST',
              body: {
                user_id: user.id,
              },
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: supabaseAnonKey,
              }
            });
            
            if (updateError) {
              console.error('Error with invoke method for update-subscription:', updateError);
              throw new Error(`Edge Function error: ${updateError.message}`);
            }
            
            console.log('Subscription update response:', updateData);
            return true;
          } catch (updateInvokeError) {
            // If invoke fails, try direct fetch as fallback
            console.warn('Invoke method failed for update-subscription, falling back to direct fetch:', updateInvokeError);
            
            // Call the update-subscription function which uses service_role permissions
            console.log('Making request to update-subscription with headers:', {
              hasAuthHeader: !!token,
              authHeaderPrefix: token ? token.substring(0, 5) + '...' : 'none',
              hasApiKey: !!supabaseAnonKey,
              url: `${supabaseUrl}/functions/v1/update-subscription`,
            });
            
            const updateResponse = await fetch(`${supabaseUrl}/functions/v1/update-subscription`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                user_id: user.id,
              }),
            });
            
            console.log('Update response status:', updateResponse.status);
            
            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              console.error('Error updating subscription via Edge Function:', 
                updateResponse.status, 
                updateResponse.statusText,
                errorText
              );
              
              // Try to parse the error response as JSON for more details
              try {
                const errorJson = JSON.parse(errorText);
                console.error('Detailed error from Edge Function:', errorJson);
              } catch (e) {
                console.error('Error response is not valid JSON');
              }
              
              if (updateResponse.status === 401) {
                throw new PaymentError(
                  'Authentication failed when updating subscription. Please try logging out and back in.',
                  'auth_failed'
                );
              } else if (updateResponse.status === 500) {
                throw new PaymentError(
                  'Server error when updating subscription. Please try again later or contact support.',
                  'server_error'
                );
              }
              
              throw new Error(`Update failed: ${updateResponse.statusText} - ${errorText}`);
            }
            
            const updateData = await updateResponse.json();
            console.log('Subscription update response:', updateData);
            
            // If we got here, assume success
            return true;
          }
        } catch (updateError) {
          console.error('Error calling update-subscription function:', updateError);
          
          // Last resort: Try to update directly with the client
          console.log('Attempting direct database update as last resort...');
          
          try {
            // Try to update the subscription status directly
            await updateSubscriptionStatus(user.id, true);
            return true;
          } catch (directUpdateError) {
            console.error('Direct update failed:', directUpdateError);
            throw new PaymentError(
              'All subscription update methods failed. Please contact support.',
              'update_failed',
              directUpdateError
            );
          }
        }
      } catch (dbError) {
        console.error('Fallback verification failed:', dbError);
        throw new PaymentError(
          'Failed to verify payment. Please contact support.',
          'verification_failed',
          dbError
        );
      }
    }
  } catch (error) {
    console.error('Error in verifyPaymentSession:', error);
    
    // If it's already a PaymentError, rethrow it
    if (error instanceof PaymentError) {
      throw error;
    }
    
    // Check for network errors
    if (error instanceof Error) {
      if (error.message.includes('network') || 
          error.message.includes('net::ERR_FAILED') || 
          error.message.includes('Failed to fetch')) {
        throw new PaymentError(
          'Network error while verifying payment. Please check your internet connection and try again.',
          'verification_network_error',
          error
        );
      }
      
      if (error.message.includes('Failed to send a request to the Edge Function')) {
        throw new PaymentError(
          'Payment verification system is currently unavailable. Please contact support.',
          'edge_function_unavailable',
          error
        );
      }
    }
    
    // Generic error
    throw new PaymentError(
      `Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'verification_failed',
      error
    );
  }
};

/**
 * Updates the user's subscription status in the database
 * @param userId The user ID to update
 * @param isSubscribed Whether the user is subscribed
 */
export const updateSubscriptionStatus = async (userId: string, isSubscribed: boolean): Promise<void> => {
  try {
    if (!userId) {
      throw new PaymentError(
        'No user ID provided for subscription update',
        'missing_user_id'
      );
    }
    
    // Check for internet connectivity
    try {
      const online = navigator.onLine;
      if (!online) {
        throw new PaymentError(
          'No internet connection. Please check your network and try again.',
          'network_offline'
        );
      }
    } catch (e) {
      // If we can't check navigator.onLine, just continue
    }
    
    // Get the JWT token from the current session
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!token) {
      throw new PaymentError(
        'Authentication required for subscription update',
        'authentication_required'
      );
    }
    
    console.log('Calling update-subscription with:', {
      user_id: userId,
      is_subscribed: isSubscribed,
      hasToken: !!token,
      hasApiKey: !!supabaseAnonKey
    });
    
    try {
      // First attempt: Use the Edge Function to update the subscription status
      console.log('Attempting to update subscription via Supabase invoke...');
      try {
        const { data, error } = await supabase.functions.invoke('update-subscription', {
          method: 'POST',
          body: {
            user_id: userId,
            is_subscribed: isSubscribed
          },
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseAnonKey
          }
        });
        
        console.log('Invoke response:', { data, error });
  
        if (error) {
          console.error('Error updating subscription status via invoke:', error);
          throw new Error(`Edge Function error: ${error.message}`);
        }
        
        return; // Success, exit early
      } catch (invokeError) {
        console.error('Invoke method failed, trying direct fetch:', invokeError);
        
        // Second attempt: Try direct fetch to the Edge Function
        try {
          console.log('Making direct fetch request to update-subscription...');
          const response = await fetch(`${supabaseUrl}/functions/v1/update-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': supabaseAnonKey
            },
            body: JSON.stringify({
              user_id: userId,
              is_subscribed: isSubscribed
            })
          });
          
          console.log('Direct fetch response status:', response.status);
          
          // Try to get the response body regardless of status
          let responseBody;
          try {
            const responseText = await response.text();
            try {
              responseBody = JSON.parse(responseText);
              console.log('Response body:', responseBody);
            } catch (e) {
              console.log('Response is not JSON:', responseText);
              responseBody = responseText;
            }
          } catch (e) {
            console.error('Could not read response body:', e);
          }
          
          if (!response.ok) {
            console.error('Error from direct fetch:', 
              response.status, 
              response.statusText,
              responseBody
            );
            
            if (response.status === 401) {
              throw new PaymentError(
                'Authentication failed when updating subscription. Please try logging out and back in.',
                'auth_failed'
              );
            } else if (response.status === 500) {
              throw new PaymentError(
                `Server error when updating subscription: ${responseBody?.error || responseBody || 'Unknown error'}. Please try again later or contact support.`,
                'server_error'
              );
            }
            
            throw new Error(`Update failed: ${response.statusText} - ${responseBody?.error || responseBody || 'Unknown error'}`);
          }
          
          console.log('Direct fetch successful');
          return; // Success, exit early
        } catch (fetchError) {
          console.error('Direct fetch also failed:', fetchError);
          
          // Third attempt: Try direct database update as last resort
          console.log('Attempting direct database update as last resort...');
          
          // This will likely fail due to RLS, but we'll try anyway
          const { data, error: dbError } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              is_subscribed: isSubscribed,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            });
            
          console.log('Direct database update result:', { data, error: dbError });
            
          if (dbError) {
            console.error('Direct database update failed:', dbError);
            throw new PaymentError(
              `All subscription update methods failed. Please contact support.`,
              'subscription_update_failed',
              { invokeError, fetchError, dbError }
            );
          }
          
          return; // Success, exit early
        }
      }
    } catch (error) {
      console.error('Error in updateSubscriptionStatus:', error);
      
      // If it's already a PaymentError, rethrow it
      if (error instanceof PaymentError) {
        throw error;
      }
      
      // Check for network errors
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('internet') || error.message.includes('offline')) {
          throw new PaymentError(
            'Network error while updating subscription status. Please check your internet connection.',
            'network_error',
            error
          );
        }
      }
      
      // Generic error
      throw new PaymentError(
        `Subscription update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'subscription_update_failed',
        error
      );
    }
  } catch (error) {
    console.error('Error in updateSubscriptionStatus:', error);
    
    // If it's already a PaymentError, rethrow it
    if (error instanceof PaymentError) {
      throw error;
    }
    
    // Check for network errors
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('internet') || error.message.includes('offline')) {
        throw new PaymentError(
          'Network error while updating subscription status. Please check your internet connection.',
          'network_error',
          error
        );
      }
    }
    
    // Generic error
    throw new PaymentError(
      `Subscription update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'subscription_update_failed',
      error
    );
  }
};

/**
 * Handles checkout using a direct Stripe checkout URL if available
 * This is a fallback mechanism when the Edge Function approach fails
 * @returns The URL to redirect to for checkout
 */
export const getDirectCheckoutUrl = (): string | null => {
  const directCheckoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL;
  if (directCheckoutUrl && directCheckoutUrl.includes('buy.stripe.com')) {
    console.log('Using direct Stripe checkout URL:', directCheckoutUrl);
    return directCheckoutUrl;
  }
  return null;
}; 