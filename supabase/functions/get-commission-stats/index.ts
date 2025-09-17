import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the user and their club info
    const authToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { sales_channel_url } = await req.json()

    if (!sales_channel_url) {
      throw new Error('Sales channel URL is required')
    }

    console.log('Fetching commission stats for:', sales_channel_url)

    // Call BOB API using salesProvize module
    const modules = [
      {
        module: "kastomi",
        method: "salesProvize",
        key: `get_salesProvize_${Date.now()}`,
        data: {
          url: "fanshop.tatranflorbal.cz"
        }
      }
    ]

    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules },
      headers: { Authorization: authHeader }
    })

    if (bobError) {
      console.error('BOB API error:', bobError)
      throw bobError
    }

    // Extract commission stats from BOB API response
    const provizeData = bobResponse?.modules?.[0]?.data || bobResponse?.data || {}

    console.log('Commission stats data:', provizeData)

    // Return the commission statistics
    return new Response(
      JSON.stringify({
        blokovano: provizeData.blokovano || 0,
        uvolneno: provizeData.uvolneno || 0,
        payout: provizeData.payout || 0,
        vyplaceno: provizeData.vyplaceno || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-commission-stats:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})