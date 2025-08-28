// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

// Initialize Supabase client with service role key
// @ts-ignore: Deno namespace is available in Supabase Edge Functions
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
// @ts-ignore: Deno namespace is available in Supabase Edge Functions
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// @ts-ignore: Deno namespace is available in Supabase Edge Functions
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  console.log('Received request to update-subscription function');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries([...req.headers.entries()]));

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Missing or invalid Authorization header');
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Extract the JWT token
  const token = authHeader.split(' ')[1];
  console.log('Token received (first 10 chars):', token.substring(0, 10) + '...');
  
  try {
    // Verify the JWT token
    console.log('Verifying JWT token...');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token', details: authError }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', userData.user.id);

    try {
      console.log('Parsing request body...');
      
      // Get the request body
      let requestData;
      try {
        requestData = await req.json();
        console.log('Request body parsed successfully');
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON in request body',
            details: parseError.message
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      const { user_id, is_subscribed } = requestData;
      
      console.log('Request data:', { user_id, is_subscribed });

      // Validate required parameters
      if (!user_id) {
        console.error('Missing user_id parameter');
        return new Response(
          JSON.stringify({ 
            error: 'Missing required parameter: user_id' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Updating subscription for user:', user_id);
      console.log('Is subscribed value:', is_subscribed);
      
      // Update the user's subscription status in the database
      try {
        console.log('Executing database operation...');
        const { error: dbError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user_id,
            is_subscribed: is_subscribed !== undefined ? is_subscribed : true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (dbError) {
          console.error('Error updating subscription status:', dbError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to update subscription status', 
              details: dbError.message,
              code: dbError.code
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log('Subscription updated successfully');
        
        // Return success
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Subscription status updated successfully'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (dbOperationError) {
        console.error('Database operation error:', dbOperationError);
        return new Response(
          JSON.stringify({ 
            error: 'Database operation failed', 
            details: dbOperationError.message,
            stack: dbOperationError.stack
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update subscription status', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to authenticate', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 