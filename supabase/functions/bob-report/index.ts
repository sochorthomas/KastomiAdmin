import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { KJUR, KEYUTIL } from "https://esm.sh/jsrsasign@10.5.23";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
};

function encodeJWT(payload: any, privateKey: string) {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(payload);
  
  // Try different key parsing approaches
  let key;
  
  try {
    // First try: direct key parsing
    key = KEYUTIL.getKey(privateKey);
  } catch (e1) {
    console.log("Direct key parsing failed, trying PEM format");
    try {
      // Second try: ensure proper PEM format
      let pemKey = privateKey.trim();
      
      // Add headers if missing
      if (!pemKey.includes("-----BEGIN")) {
        pemKey = `-----BEGIN RSA PRIVATE KEY-----\n${pemKey}\n-----END RSA PRIVATE KEY-----`;
      }
      
      key = KEYUTIL.getKey(pemKey);
    } catch (e2) {
      console.log("PEM format failed, trying base64 decode");
      throw new Error(`Unable to parse private key: ${e1.message}`);
    }
  }
  
  return KJUR.jws.JWS.sign("RS256", sHeader, sPayload, key);
}

serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role for auth verification
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get and validate the user
    const authToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's profile to verify they have a valid club
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('user_profiles')
      .select('club_id')
      .eq('auth_id', user.id)
      .single()

    if (userDataError || !userData || !userData.club_id) {
      throw new Error('User profile not found or no club assigned')
    }
    const { reportId, value } = await req.json();
    
    console.log("BOB report request:", { reportId, value });
    
    // Get environment variables
    const privateKeyRaw = Deno.env.get("BOB_PRIVATE_KEY");
    const bobToken = Deno.env.get("BOB_TOKEN");
    
    if (!bobToken || !privateKeyRaw) {
      console.error("Missing environment variables");
      return new Response(JSON.stringify({
        error: "Missing env vars",
        hasToken: !!bobToken,
        hasPrivateKey: !!privateKeyRaw
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Debug private key format
    console.log("Private key info:", {
      length: privateKeyRaw.length,
      hasBeginMarker: privateKeyRaw.includes("BEGIN"),
      hasEndMarker: privateKeyRaw.includes("END"),
      first50Chars: privateKeyRaw.substring(0, 50),
      last50Chars: privateKeyRaw.substring(privateKeyRaw.length - 50)
    });
    
    // Process private key
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    
    const domain = "https://bob.kastomi.com/";
    
    // Create JWT modules
    const moduleAccess = {
      module: "access",
      method: "token",
      key: `get_token_${Date.now()}`,
      data: {
        access_token: bobToken
      }
    };
    
    const moduleReport = {
      module: "report",
      method: "reportById",
      key: `get_reportById_${Date.now()}`,
      data: {
        id: reportId,
        value
      }
    };
    
    const apiCall = [
      moduleAccess,
      moduleReport
    ];
    
    let jwtToken;
    try {
      jwtToken = encodeJWT(apiCall, privateKey);
    } catch (jwtError) {
      console.error("JWT encoding failed:", jwtError);
      return new Response(JSON.stringify({
        error: "JWT encoding failed",
        details: jwtError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    console.log("Calling BOB API...");
    
    // Call BOB API
    const bobResponse = await fetch(`${domain}api/v3/queue?_tracy_skip_error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: JSON.stringify(jwtToken)
    });
    
    console.log("BOB API response status:", bobResponse.status);
    
    const rawText = await bobResponse.text();
    console.log("BOB API raw response:", rawText);
    let responseData: any = {};
    
    try {
      responseData = JSON.parse(rawText);
    } catch (e) {
      return new Response(JSON.stringify({
        error: "BOB API returned invalid JSON",
        rawText
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Check access
    const access = responseData.modules?.[0]?.data?.access;
    if (access === false) {
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
    
    const data = responseData.modules?.[1]?.data?.data || [];
    
    // Logging
    console.log("REPORT ID:", reportId);
    console.log("VALUE (internal):", value);
    console.log("BOB RAW RESPONSE:", rawText);
    
    return new Response(JSON.stringify({
      data
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (e) {
    const status = e.message === 'Unauthorized' || e.message === 'No authorization header' ? 401 : 
                   e.message === 'User profile not found or no club assigned' ? 403 : 500
    
    return new Response(JSON.stringify({
      error: e.message
    }), {
      status: status,
      headers: corsHeaders
    });
  }
});