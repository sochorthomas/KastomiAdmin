import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to aggregate variants by offer
function aggregateVariantsByOffer(variants) {
  const offersMap = {}
  
  for (const v of variants) {
    const offerId = v.sales_offer_id
    if (!offersMap[offerId]) {
      offersMap[offerId] = {
        id: v.sales_offer_id,
        sales_offer_id: v.sales_offer_id,
        sales_offer_name: v.sales_offer_name,
        sales_offer_text: v.sales_offer_text,
        seo: v.seo,
        wholesale_price: v.wholesale_price,
        price: v.price,
        variants: []
      }
    }
    offersMap[offerId].variants.push(v)
  }
  
  return Object.values(offersMap)
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

    // Get user's club information
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('user_profiles')
      .select('club_id')
      .eq('auth_id', user.id)
      .single()

    if (userDataError || !userData) {
      throw new Error('User profile not found')
    }

    // Now get club by bob_id (user_profiles.club_id = clubs.bob_id)
    const { data: clubData, error: clubError } = await supabaseAdmin
      .from('clubs')
      .select('id, name, bob_id, internal')
      .eq('bob_id', userData.club_id)
      .single()

    if (clubError || !clubData) {
      throw new Error('Club not found')
    }

    console.log('Club data:', {
      id: clubData.id,
      name: clubData.name,
      bob_id: clubData.bob_id,
      internal: clubData.internal
    })

    // Call BOB report to get variants (report ID 25)
    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-report', {
      body: { 
        reportId: 25, 
        value: Number(clubData.bob_id) 
      },
      headers: { Authorization: authHeader }
    })

    if (bobError) throw bobError

    console.log("BOB API variants response:", JSON.stringify(bobResponse, null, 2))

    // Extract variants data
    const variantsData = bobResponse?.data || []
    
    // Log raw variants data
    console.log("Raw variants data:", JSON.stringify(variantsData, null, 2))
    
    // Log first variant in detail if available
    if (variantsData.length > 0) {
      console.log("First variant details:", JSON.stringify(variantsData[0], null, 2))
      console.log("All keys in first variant:", Object.keys(variantsData[0]))
    }

    // Aggregate variants by sales offer
    const offers = aggregateVariantsByOffer(variantsData)
    
    console.log("Aggregated offers:", JSON.stringify(offers, null, 2))

    // Format offers for frontend
    const formattedOffers = offers.map(offer => {
      // Get price from first variant since prices are at offer level
      // All variants of an offer should have the same price
      const firstVariant = offer.variants[0] || {}
      
      // Extract prices from BOB data
      // Based on the data structure: wholesale_price and price (final price) are provided
      // klub_price is calculated as: price - wholesale_price
      const wholesalePrice = Number(firstVariant.wholesale_price) || 0
      const finalPrice = Number(firstVariant.price) || 0
      const klubPrice = finalPrice - wholesalePrice
      
      console.log(`Offer ${offer.sales_offer_id} prices:`, {
        wholesale: wholesalePrice,
        final: finalPrice,
        klub_calculated: klubPrice,
        raw_wholesale: firstVariant.wholesale_price,
        raw_price: firstVariant.price
      })
      
      return {
      id: offer.sales_offer_id,
      name: offer.sales_offer_name || '',
      seo: offer.seo || '',
      sales_offer_text: firstVariant.sales_offer_text || '',
      wholesale_price: wholesalePrice,
      price: finalPrice,
      klub_price: klubPrice,
      // Add price_range for compatibility
      price_range: {
        min: finalPrice,
        max: finalPrice
      },
      variants: offer.variants.map(v => ({
        id: v.variant_id,
        variant_id: v.variant_id,
        name: v.sales_offer_name || v.variant || '',
        variant_name: v.variant || '',
        size: v.variant_size || '',
        color: v.variant_color || '',
        dimensions: v.variant_dimensions || '',
        image: v.variant_image || '',
        // Prices are same for all variants of an offer
        wholesale_price: wholesalePrice,
        price: finalPrice,
        klub_price: klubPrice,
        stock: v.stock || 0,
        active: v.active !== false,
        created_at: v.created_at,
        updated_at: v.updated_at
      })),
      // Calculate totals from variants
      total_stock: offer.variants.reduce((sum, v) => sum + (v.stock || 0), 0),
      variant_count: offer.variants.length
    }
    })

    return new Response(
      JSON.stringify({ offers: formattedOffers }),
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