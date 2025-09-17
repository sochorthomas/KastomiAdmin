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

    console.log('Fetching payouts for:', sales_channel_url)

    // Call BOB API using salesPayout module
    const modules = [
      {
        module: "kastomi",
        method: "salesPayout",
        key: `get_salesPayout_${Date.now()}`,
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

    // Extract payout data from BOB API response
    const payoutData = bobResponse?.modules?.[0]?.data || bobResponse?.data || {}

    console.log('Payout data received:', {
      hasPayouts: !!payoutData.payouts,
      payoutsCount: payoutData.payouts?.length || 0,
      hasToPayoutItems: !!payoutData.to_payout_items,
      toPayoutItemsCount: payoutData.to_payout_items?.length || 0
    })

    // Ensure we have the expected structure
    const result = {
      payouts: payoutData.payouts || [],
      to_payout_items: payoutData.to_payout_items || []
    }

    // Add created_at timestamp if not present (for better UI experience)
    result.payouts = result.payouts.map(payout => ({
      ...payout,
      created_at: payout.created_at || payout.datum || null,
      items: payout.items || []
    }))

    // Return the payout data
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-payouts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})