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
    const { sales_channel_url } = await req.json()

    // Require sales channel URL
    if (!sales_channel_url) {
      throw new Error('Sales channel URL is required')
    }

    // Prepare module for BOB API to get customer data
    const modules = [
      {
        module: "kastomi",
        method: "salesUsers",
        key: "get_salesUsers_" + Date.now(),
        data: {
          url: sales_channel_url
        }
      }
    ]

    console.log("Calling BOB API for customer contacts with modules:", modules)

    // Call central BOB API function
    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules },
      headers: { Authorization: authHeader }
    })

    if (bobError) throw bobError

    console.log("BOB API customer response:", bobResponse)

    // Extract customer data
    const customersData = bobResponse.modules?.[0]?.data || []
    const customers = Array.isArray(customersData) ? customersData : []

    // Create lookup maps for email and phone contacts
    const emailMap = new Map()
    const phoneMap = new Map()
    
    // Process customer data to create contact lookups
    customers.forEach(customer => {
      // Map email contact IDs
      if (customer.kontakt_email_id && customer.email) {
        emailMap.set(customer.kontakt_email_id, customer.email)
      }
      if (customer.zakaznik_kontakt_email_id && customer.email) {
        emailMap.set(customer.zakaznik_kontakt_email_id, customer.email)
      }
      
      // Map phone contact IDs
      if (customer.kontakt_mobil_id && (customer.mobil || customer.telefon)) {
        phoneMap.set(customer.kontakt_mobil_id, customer.mobil || customer.telefon)
      }
      if (customer.zakaznik_kontakt_mobil_id && (customer.mobil || customer.telefon)) {
        phoneMap.set(customer.zakaznik_kontakt_mobil_id, customer.mobil || customer.telefon)
      }
    })

    // Return the contact maps
    const result = {
      emailContacts: Object.fromEntries(emailMap),
      phoneContacts: Object.fromEntries(phoneMap),
      totalCustomers: customers.length
    }

    console.log(`Returning ${emailMap.size} email contacts and ${phoneMap.size} phone contacts`)

    return new Response(
      JSON.stringify(result),
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