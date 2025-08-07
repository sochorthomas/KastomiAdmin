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

    // Get request parameters
    const { order_id, sales_channel_url } = await req.json()

    if (!order_id || !sales_channel_url) {
      throw new Error('Order ID and sales channel URL are required')
    }

    // Try to get order detail with a specific method
    const orderDetailModule = {
      module: "kastomi",
      method: "salesOrder", // Singular, might return more details
      key: "get_salesOrder_" + Date.now(),
      data: {
        url: sales_channel_url,
        id: order_id
      }
    }

    console.log("Fetching order detail from BOB API for order:", order_id)
    const { data: orderResponse, error: orderError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules: [orderDetailModule] },
      headers: { Authorization: authHeader }
    })

    if (orderError) {
      console.error("Error fetching order detail:", orderError)
      // If specific order method doesn't work, try general orders method
      const ordersModule = {
        module: "kastomi",
        method: "salesOrders",
        key: "get_salesOrders_" + Date.now(),
        data: {
          url: sales_channel_url
        }
      }

      const { data: ordersResponse, error: ordersError } = await supabaseClient.functions.invoke('bob-api', {
        body: { modules: [ordersModule] },
        headers: { Authorization: authHeader }
      })

      if (ordersError) throw ordersError

      // Find the specific order
      const orders = ordersResponse.modules?.[0]?.data || []
      const order = orders.find(o => o.id === order_id || o.order_id === order_id)
      
      if (!order) {
        throw new Error('Order not found')
      }

      return new Response(
        JSON.stringify({ order }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const orderData = orderResponse.modules?.[0]?.data
    console.log("Order detail response:", JSON.stringify(orderData, null, 2))

    return new Response(
      JSON.stringify({ order: orderData }),
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