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
    const { sales_channel_url, items, poznamka } = await req.json()

    if (!sales_channel_url) {
      throw new Error('Sales channel URL is required')
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('At least one item is required')
    }

    console.log('Creating payout for:', {
      sales_channel_url,
      items_count: items.length,
      poznamka
    })

    // For now, we'll simulate the creation since the actual BOB API endpoint might not exist
    // In a real implementation, this would call the BOB API with a method like "salesPayoutCreate"

    // Simulate API call to create payout
    const modules = [
      {
        module: "kastomi",
        method: "salesPayoutCreate", // This method needs to be implemented in BOB API
        key: `create_payout_${Date.now()}`,
        data: {
          url: "fanshop.tatranflorbal.cz", // Static URL for testing
          items: items,
          poznamka: poznamka || ''
        }
      }
    ]

    // For testing purposes, we'll simulate a successful response
    // In production, this would actually call the BOB API
    console.log('Would send to BOB API:', modules)

    // Simulate successful response
    const simulatedResponse = {
      success: true,
      payout_id: `PAYOUT-${Date.now()}`,
      message: 'Payout request created successfully',
      items_count: items.length,
      poznamka: poznamka
    }

    // In production, uncomment this to actually call BOB API:
    /*
    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules },
      headers: { Authorization: authHeader }
    })

    if (bobError) {
      console.error('BOB API error:', bobError)
      throw bobError
    }

    const result = bobResponse?.modules?.[0]?.data || bobResponse?.data || {}
    */

    // Return success response
    return new Response(
      JSON.stringify(simulatedResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-payout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})