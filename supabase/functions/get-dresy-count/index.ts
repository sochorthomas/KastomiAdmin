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

    // Create Supabase client
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

    // Get request body
    const { sales_channel_url } = await req.json()
    
    if (!sales_channel_url) {
      throw new Error('Sales channel URL is required')
    }

    // Create the module for BOB API
    const module = {
      module: "kastomi",
      method: "salesDresy",
      key: `get_dresy_${Date.now()}`,
      data: {
        url: sales_channel_url
      }
    }

    console.log('Calling BOB API with module:', module)

    // Call BOB API
    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules: [module] },
      headers: { Authorization: authHeader }
    })

    if (bobError) {
      console.error('BOB API error:', bobError)
      throw bobError
    }

    console.log('BOB API response:', bobResponse)

    // Extract data from response
    const dresyData = bobResponse?.modules?.[0]?.data || []
    const count = Array.isArray(dresyData) ? dresyData.length : 0

    console.log(`Found ${count} dresy records`)

    return new Response(
      JSON.stringify({ count }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, count: 0 }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'No authorization header' ? 401 : 500
      }
    )
  }
})