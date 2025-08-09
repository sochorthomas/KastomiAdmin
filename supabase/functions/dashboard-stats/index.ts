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
    const { date_from, date_to, sales_channel_url } = await req.json()

    // Require sales channel URL
    if (!sales_channel_url) {
      throw new Error('Sales channel URL is required')
    }

    // Prepare date range (if date_from is null, don't send it to show all records)
    const fromDate = date_from || null
    const toDate = date_to || new Date().toISOString().split('T')[0]

    // Prepare modules for BOB API
    const dashboardData: any = {
      url: sales_channel_url,
      to: toDate
    }
    // Only add from date if it's provided
    if (fromDate) {
      dashboardData.from = fromDate
    }
    
    const modules = [
      {
        module: "kastomi",
        method: "salesChannelDashboard",
        key: "get_salesChannelDashboard_" + Date.now(),
        data: dashboardData
      },
      {
        module: "kastomi",
        method: "salesOrders",
        key: "get_salesOrders_" + Date.now(),
        data: {
          url: sales_channel_url
        }
      }
    ]

    // Call central BOB API function
    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules },
      headers: { Authorization: authHeader }
    })

    if (bobError) throw bobError

    console.log("BOB API response:", bobResponse)

    // Extract data from responses
    const dashboardData = bobResponse.modules?.[0]?.data || {}
    const ordersData = bobResponse.modules?.[1]?.data || {}

    // Format response for frontend
    const response = {
      stats: {
        order_count: dashboardData.order_count || dashboardData.orderCount || dashboardData.pocet_objednavek || 0,
        total_revenue: dashboardData.total_revenue || dashboardData.totalRevenue || dashboardData.celkove_trzby || 0,
        product_count: dashboardData.product_count || dashboardData.productCount || dashboardData.pocet_produktu || 0
      },
      recent_orders: ordersData.orders || ordersData.objednavky || []
    }

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