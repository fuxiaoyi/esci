# Shared Utilities for Supabase Edge Functions

This directory contains shared utilities that can be used across multiple Edge Functions.

## Contents

### `cors.ts`

Provides CORS (Cross-Origin Resource Sharing) utilities for Edge Functions:

- `corsHeaders`: Standard CORS headers to include in responses
- `handleCors`: Function to handle OPTIONS requests for CORS preflight

## Usage

Import the utilities in your Edge Function:

```typescript
import { corsHeaders, handleCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Your function logic here...

  // Include CORS headers in your response
  return new Response(
    JSON.stringify({ result: "success" }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
``` 