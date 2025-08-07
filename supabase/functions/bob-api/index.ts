import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { KJUR, KEYUTIL } from "https://esm.sh/jsrsasign@10.5.23"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSA Private Key for BOB API
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQC8kGa1pSjbSYZVebtTRBLxBz5H4i2p/llLCrEeQhta5kaQu/Rn
vuER4W8oDH3+3iuIYW4VQAzyqFpwuzjkDI+17t5t0tyazyZ8JXw+KgXTxldMPEL9
5+qVhgXvwtihXC1c5oGbRlEDvDF6Sa53rcFVsYJ4ehde/zUxo6UvS7UrBQIDAQAB
AoGAb/MXV46XxCFRxNuB8LyAtmLDgi/xRnTAlMHjSACddwkyKem8//8eZtw9fzxz
bWZ/1/doQOuHBGYZU8aDzzj59FZ78dyzNFoF91hbvZKkg+6wGyd/LrGVEB+Xre0J
Nil0GReM2AHDNZUYRv+HYJPIOrB0CRczLQsgFJ8K6aAD6F0CQQDzbpjYdx10qgK1
cP59UHiHjPZYC0loEsk7s+hUmT3QHerAQJMZWC11Qrn2N+ybwwNblDKv+s5qgMQ5
5tNoQ9IfAkEAxkyffU6ythpg/H0Ixe1I2rd0GbF05biIzO/i77Det3n4YsJVlDck
ZkcvY3SK2iRIL4c9yY6hlIhs+K9wXTtGWwJBAO9Dskl48mO7woPR9uD22jDpNSwe
k90OMepTjzSvlhjbfuPN1IdhqvSJTDychRwn1kIJ7LQZgQ8fVz9OCFZ/6qMCQGOb
qaGwHmUK6xzpUbbacnYrIM6nLSkXgOAwv7XXCojvY614ILTK3iXiLBOxPu5Eu13k
eUz9sHyD6vkgZzjtxXECQAkp4Xerf5TGfQXGXhxIX52yH+N2LtujCdkQZjXAsGdm
B2zNzvrlgRmgBrklMTrMYgm1NPcW+bRLGcwgW2PTvNM=
-----END RSA PRIVATE KEY-----`

function encodeJWT(payload: any, privateKey: string) {
  const header = { alg: "RS256", typ: "JWT" };
  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(payload);
  const key = KEYUTIL.getKey(privateKey);
  return KJUR.jws.JWS.sign("RS256", sHeader, sPayload, key);
}

// UNIVERZÁLNÍ FUNKCE PRO VŠECHNY API VOLÁNÍ
async function callBobApi(modules: any[], privateKey: string) {
  const jwt = encodeJWT(modules, privateKey);
  let res;
  try {
    res = await fetch('https://bob.kastomi.com/api/v3/queue?_tracy_skip_error', {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: JSON.stringify(jwt)
    });
  } catch (err) {
    throw new Error("Chyba při fetch: " + err);
  }
  const text = await res.text();
  console.log("BOB API RAW RESPONSE:", text);
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Chybný JSON z BOB API: " + text);
  }
  return data;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Get modules from request body
    const { modules } = await req.json()
    
    if (!modules || !Array.isArray(modules)) {
      throw new Error('Invalid request: modules array required')
    }

    console.log('Calling BOB API with modules:', modules)
    
    // Call BOB API
    const response = await callBobApi(modules, PRIVATE_KEY)
    
    console.log('BOB API response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' || error.message === 'No authorization header' ? 401 : 
                error.message === 'User profile not found or no club assigned' ? 403 : 500
      }
    )
  }
})