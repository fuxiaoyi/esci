import type { NextApiRequest, NextApiResponse } from "next";

import { supabase } from "../../../../lib/supabase";
import R from "../../../../utils/r";

interface SupabaseHealthResponse {
  connected: boolean;
  status?: string;
  error?: string;
  timestamp: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json(R.fail("Method not allowed"));
  }

  try {
    const response: SupabaseHealthResponse = {
      connected: false,
      timestamp: new Date().toISOString(),
    };

    // Test Supabase connection by attempting to get the current session
    // This is a lightweight operation that will fail if Supabase is unreachable
    const { error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn("Supabase session check failed:", sessionError.message);
      response.status = "session_error";
      response.error = sessionError.message;
    } else {
      // Additional health check: try to ping Supabase with a simple query
      // Using a minimal query that should work even without authentication
      const { error: healthError } = await supabase
        .from('_supabase_migrations')
        .select('version')
        .limit(1);
      
      if (healthError) {
        // If the migrations table doesn't exist, try a different approach
        // Check if we can at least connect to Supabase by trying to get user info
        const { error: userError } = await supabase.auth.getUser();
        
        if (userError && userError.message.includes('Invalid API key')) {
          response.status = "invalid_api_key";
          response.error = "Invalid Supabase API key";
        } else if (userError && userError.message.includes('network')) {
          response.status = "network_error";
          response.error = "Network connection failed";
        } else {
          // If we get here, Supabase is connected but we might not have the right permissions
          // This is still considered a successful connection
          response.connected = true;
          response.status = "connected";
        }
      } else {
        response.connected = true;
        response.status = "connected";
      }
    }

    return res.json(response);
  } catch (error) {
    console.error("Error in /api/auth/sid/info:", error);
    const errorResponse: SupabaseHealthResponse = {
      connected: false,
      status: "connection_failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(errorResponse);
  }
}
