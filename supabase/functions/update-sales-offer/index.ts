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

    // Get the user
    const authToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { id, wholesale_price, klub_price, text, active, sales_channel_url } = await req.json()
    
    console.log('Update request received:', { id, wholesale_price, klub_price, text, active, sales_channel_url })
    
    if (!id) {
      throw new Error('Sales offer ID is required')
    }

    // Calculate final price
    const price = Number(wholesale_price || 0) + Number(klub_price || 0)
    
    console.log('Calculated price:', price)

    // Get BOB API token from environment
    const bobToken = Deno.env.get("BOB_TOKEN");
    
    if (!bobToken) {
      throw new Error('BOB API token not configured')
    }

    // Prepare modules for BOB API
    const modules = [
      {
        module: "access",
        method: "token",
        key: `get_token_${Date.now()}`,
        data: {
          access_token: bobToken
        }
      },
      {
        module: "kastomi",
        method: "setSalesOffer",
        key: `set_salesOffer_${Date.now()}`,
        data: {
          id: id,
          price: price,
          text: text || '',
          active: active ? 1 : 0,
          url: sales_channel_url || ''
        }
      }
    ]

    console.log('Sales channel URL being sent:', sales_channel_url)
    console.log('Sending to BOB API setSalesOffer:', modules[1].data)

    // Call central BOB API function
    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules },
      headers: { Authorization: authHeader }
    })

    if (bobError) throw bobError

    console.log('BOB API response:', bobResponse)

    // Check access
    const access = bobResponse.modules?.[0]?.data?.access ?? false
    if (access === false) {
      throw new Error('BOB API access denied')
    }

    // Get the result from setSalesOffer module
    const setSalesOfferResult = bobResponse.modules?.[1]?.data || {}
    
    console.log('setSalesOffer module result:', setSalesOfferResult)
    console.log('Full BOB API response:', JSON.stringify(bobResponse, null, 2))

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: setSalesOfferResult,
        updatedPrice: price 
      }),
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
        status: error.message === 'No authorization header' ? 401 : 500
      }
    )
  }
})