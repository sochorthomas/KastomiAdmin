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
    const { sales_channel_url, payout_id } = await req.json()

    if (!sales_channel_url) {
      throw new Error('Sales channel URL is required')
    }

    if (!payout_id) {
      throw new Error('Payout ID is required')
    }

    console.log('Fetching payout detail for:', { sales_channel_url, payout_id })

    // Call BOB API using salesPayout module to get all payouts
    const modules = [
      {
        module: "kastomi",
        method: "salesPayout",
        key: `get_salesPayout_${Date.now()}`,
        data: {
          url: "fanshop.tatranflorbal.cz" // Hardcoded for testing
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

    console.log('All payouts received, looking for ID:', payout_id)

    // Find the specific payout by ID
    let foundPayout = null

    if (payoutData.payouts && Array.isArray(payoutData.payouts)) {
      foundPayout = payoutData.payouts.find(p => String(p.id) === String(payout_id))
    }

    if (!foundPayout) {
      console.log('Payout not found in payouts array, available IDs:',
        payoutData.payouts?.map(p => p.id) || [])

      return new Response(
        JSON.stringify({
          error: 'Payout not found',
          available_ids: payoutData.payouts?.map(p => p.id) || []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    console.log('Found payout:', {
      id: foundPayout.id,
      poznamka: foundPayout.poznamka,
      items_count: foundPayout.items?.length || 0
    })

    // Ensure items array exists
    if (!foundPayout.items) {
      foundPayout.items = []
    }

    // Return the specific payout detail
    return new Response(
      JSON.stringify({
        payout: {
          id: foundPayout.id,
          poznamka: foundPayout.poznamka || '',
          created_at: foundPayout.created_at || foundPayout.datum || null,
          date_from: foundPayout.date_from || null,
          date_to: foundPayout.date_to || null,
          items: foundPayout.items || []
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-payout-detail:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})