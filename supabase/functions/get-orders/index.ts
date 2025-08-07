import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Return the original BOB status - no mapping needed
// The frontend will handle the mapping to simplified statuses
function getOrderStatus(genStav: string): string {
  // Return the original Czech status from BOB
  return genStav || 'Neznámý'
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

    // First, get the orders
    const ordersModule = {
      module: "kastomi",
      method: "salesOrders",
      key: "get_salesOrders_" + Date.now(),
      data: {
        url: sales_channel_url
      }
    }

    console.log("Fetching orders from BOB API...")
    const { data: ordersResponse, error: ordersError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules: [ordersModule] },
      headers: { Authorization: authHeader }
    })

    if (ordersError) throw ordersError

    // Extract orders data
    const ordersData = ordersResponse.modules?.[0]?.data || []
    const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || ordersData.objednavky || [])
    console.log(`Orders found: ${orders.length}`)

    // Check if we need to fetch customer data for email/phone resolution
    const hasContactIds = orders.some(order => 
      order.zakaznik_kontakt_email_id || order.zakaznik_kontakt_mobil_id
    )

    let customers = []
    if (hasContactIds) {
      console.log("Found contact IDs, fetching customer data...")
      
      // Get customer data separately
      const customersModule = {
        module: "kastomi",
        method: "salesUsers",
        key: "get_salesUsers_" + Date.now(),
        data: {
          url: sales_channel_url
        }
      }

      const { data: customersResponse, error: customersError } = await supabaseClient.functions.invoke('bob-api', {
        body: { modules: [customersModule] },
        headers: { Authorization: authHeader }
      })

      if (!customersError && customersResponse?.modules?.[0]?.data) {
        const customersData = customersResponse.modules[0].data
        customers = Array.isArray(customersData) ? customersData : []
        console.log(`Customers found: ${customers.length}`)
      } else {
        console.log("Could not fetch customer data:", customersError || "No data returned")
      }
    }
    
    // Create lookup maps for email and phone contacts
    const emailMap = new Map()
    const phoneMap = new Map()
    
    // Process customer data to create contact lookups
    customers.forEach((customer, index) => {
      // Log first customer structure to understand the data
      if (index === 0) {
        console.log("Sample customer data structure:", JSON.stringify(customer, null, 2))
      }
      
      // Map all contact-related fields we can find
      // The BOB API might return contacts in a different structure
      
      // Try to find email - check various possible field names
      const email = customer.email || customer.Email || customer.kontakt_email || 
                   customer.zakaznik_email || customer.emailova_adresa || ''
      
      // Try to find phone - check various possible field names  
      const phone = customer.mobil || customer.telefon || customer.phone || 
                   customer.Phone || customer.tel || customer.telefonni_cislo || ''
      
      // Map by various possible ID fields
      const possibleIds = [
        customer.id,
        customer.kontakt_id,
        customer.kontakt_email_id,
        customer.kontakt_mobil_id,
        customer.zakaznik_kontakt_email_id,
        customer.zakaznik_kontakt_mobil_id,
        customer.zakaznik_id
      ].filter(id => id !== null && id !== undefined)
      
      // Store email for all possible IDs
      if (email) {
        possibleIds.forEach(id => {
          emailMap.set(id, email)
        })
      }
      
      // Store phone for all possible IDs
      if (phone) {
        possibleIds.forEach(id => {
          phoneMap.set(id, phone)
        })
      }
    })
    
    console.log(`Contact lookup maps created: ${emailMap.size} emails, ${phoneMap.size} phones`)

    // Log unique contact IDs we need to resolve
    const uniqueEmailIds = new Set(orders.map(o => o.zakaznik_kontakt_email_id).filter(Boolean))
    const uniquePhoneIds = new Set(orders.map(o => o.zakaznik_kontakt_mobil_id).filter(Boolean))
    console.log(`Unique email IDs to resolve: ${Array.from(uniqueEmailIds).join(', ')}`)
    console.log(`Unique phone IDs to resolve: ${Array.from(uniquePhoneIds).join(', ')}`)
    console.log(`Email map keys: ${Array.from(emailMap.keys()).join(', ')}`)
    console.log(`Phone map keys: ${Array.from(phoneMap.keys()).join(', ')}`)

    // Format orders for frontend - map BOB fields to our format
    const formattedOrders = orders.map((order, index) => {
      // Log first few orders to debug
      if (index < 3) {
        console.log(`Order ${index}: email_id=${order.zakaznik_kontakt_email_id}, phone_id=${order.zakaznik_kontakt_mobil_id}, customer_id=${order.zakaznik_id}`)
      }
      
      // Try to resolve email and phone from contact IDs
      let resolvedEmail = ''
      let resolvedPhone = ''
      
      // Try to get email - check multiple possible sources
      if (order.zakaznik_kontakt_email_id) {
        resolvedEmail = emailMap.get(order.zakaznik_kontakt_email_id) || ''
        if (index < 3 && !resolvedEmail) {
          console.log(`Could not resolve email for ID ${order.zakaznik_kontakt_email_id}`)
        }
      }
      if (!resolvedEmail && order.zakaznik_id) {
        resolvedEmail = emailMap.get(order.zakaznik_id) || ''
      }
      // Fallback to any email field in the order
      if (!resolvedEmail) {
        resolvedEmail = order.gen_zakaznik_email || order.email || ''
      }
      
      // Try to get phone - check multiple possible sources
      if (order.zakaznik_kontakt_mobil_id) {
        resolvedPhone = phoneMap.get(order.zakaznik_kontakt_mobil_id) || ''
        if (index < 3 && !resolvedPhone) {
          console.log(`Could not resolve phone for ID ${order.zakaznik_kontakt_mobil_id}`)
        }
      }
      if (!resolvedPhone && order.zakaznik_id) {
        resolvedPhone = phoneMap.get(order.zakaznik_id) || ''
      }
      // Fallback to any phone field in the order
      if (!resolvedPhone) {
        resolvedPhone = order.gen_zakaznik_telefon || order.telefon || order.phone || order.mobil || ''
      }
      
      return {
        id: order.id,
        order_number: order.order_id || order.cislo,
        created_at: order.datum || order.created,
        customer_name: `${order.gen_zakaznik_jmeno || ''} ${order.gen_zakaznik_prijmeni || ''}`.trim() || 'N/A',
        customer_email: resolvedEmail,
        customer_phone: resolvedPhone,
        item_count: order.polozky?.length || 0,
        total: order.cena || 0,
        status: getOrderStatus(order.gen_stav),
        payment_type: order.gen_platba_typ || '',
        paid: order.zaplaceno === 1,
        raw_status: order.gen_stav,
        status_color: order.gen_stav_barva,
        // Include contact IDs for debugging
        _contact_ids: {
          email_id: order.zakaznik_kontakt_email_id,
          phone_id: order.zakaznik_kontakt_mobil_id,
          customer_id: order.zakaznik_id
        }
      }
    })

    return new Response(
      JSON.stringify({ orders: formattedOrders }),
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