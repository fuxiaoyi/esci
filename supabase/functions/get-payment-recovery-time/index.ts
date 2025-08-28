// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Configuration for recovery time estimates
const DEFAULT_RECOVERY_TIME_MINUTES = 30;
const MAX_RECOVERY_TIME_MINUTES = 120;
const SYSTEM_STATUS_TABLE = 'system_status';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get user information from the JWT claims
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if there's a system status entry for payment system
    const { data: statusData, error: statusError } = await supabaseClient
      .from(SYSTEM_STATUS_TABLE)
      .select('status, estimated_recovery_time')
      .eq('system', 'payment')
      .single();

    if (statusError && statusError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching system status:', statusError);
      
      // Return default recovery time if there's an error
      return new Response(
        JSON.stringify({ 
          estimated_recovery_minutes: DEFAULT_RECOVERY_TIME_MINUTES,
          message: 'Payment system is currently unavailable. Please try again later.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If no status data or status is "operational", return 0 minutes (system is available)
    if (!statusData || statusData.status === 'operational') {
      return new Response(
        JSON.stringify({ 
          estimated_recovery_minutes: 0,
          message: 'Payment system is operational.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate remaining time if there's an estimated recovery time
    let estimatedRecoveryMinutes = DEFAULT_RECOVERY_TIME_MINUTES;
    
    if (statusData.estimated_recovery_time) {
      const recoveryTime = new Date(statusData.estimated_recovery_time);
      const currentTime = new Date();
      
      // Calculate minutes difference
      const diffMs = recoveryTime.getTime() - currentTime.getTime();
      const diffMinutes = Math.round(diffMs / 60000);
      
      // If recovery time is in the future, use it; otherwise use default
      if (diffMinutes > 0) {
        estimatedRecoveryMinutes = Math.min(diffMinutes, MAX_RECOVERY_TIME_MINUTES);
      }
    }

    // Return the estimated recovery time
    return new Response(
      JSON.stringify({ 
        estimated_recovery_minutes: estimatedRecoveryMinutes,
        message: `Payment system is currently unavailable. Estimated recovery time: ${estimatedRecoveryMinutes} minutes.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error getting payment recovery time:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get payment recovery time', 
        details: error.message,
        estimated_recovery_minutes: DEFAULT_RECOVERY_TIME_MINUTES
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 