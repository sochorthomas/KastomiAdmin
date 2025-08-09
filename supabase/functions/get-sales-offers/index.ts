import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to aggregate variants by offer
function aggregateVariantsByOffer(items) {
  const offersMap = {}
  
  for (const item of items) {
    // Handle both report structure and salesOffer module structure
    const offerId = item.sales_offer_id || item.id
    const offerName = item.sales_offer_name || item.name
    
    if (!offersMap[offerId]) {
      offersMap[offerId] = {
        id: offerId,
        sales_offer_id: offerId,
        sales_offer_name: offerName,
        sales_offer_text: item.sales_offer_text || item.text || '',
        seo: item.seo,
        wholesale_price: item.wholesale_price,
        price: item.price,
        active_channel: item.active_channel,
        active: item.active,
        sales_offer_status_id: item.sales_offer_status_id,
        variants: []
      }
    }
    
    // Add variant info
    offersMap[offerId].variants.push({
      variant_id: item.variant_id || item.id,
      variant: item.variant || item.variant_name || '',
      variant_size: item.variant_size || item.size || '',
      variant_color: item.variant_color || item.color || '',
      variant_dimensions: item.variant_dimensions || '',
      variant_image: item.variant_image || item.image || '',
      stock: item.stock || 0,
      active: item.active,
      active_channel: item.active_channel,
      price: item.price,
      wholesale_price: item.wholesale_price,
      sales_offer_name: offerName,
      created_at: item.created_at,
      updated_at: item.updated_at
    })
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

    // Get fresh sales channel URL from BOB using the club's internal ID
    let salesChannelUrl = null
    
    if (clubData.internal) {
      // Call bob-report to get fresh sales channel data
      const { data: bobReportData, error: bobReportError } = await supabaseClient.functions.invoke('bob-report', {
        body: {
          reportId: 14, // The report ID for sales channel data
          value: clubData.internal
        },
        headers: { Authorization: authHeader }
      })
      
      if (!bobReportError && bobReportData?.data?.[0]) {
        const salesChannelData = bobReportData.data[0]
        // Try to find URL in various fields
        salesChannelUrl = salesChannelData.url || 
                         salesChannelData.domain || 
                         salesChannelData.domena || 
                         salesChannelData.web ||
                         salesChannelData.adresa ||
                         null
      }
    }
    
    if (!salesChannelUrl) {
      console.error('No sales channel URL found for club:', clubData.name)
      throw new Error('Sales channel URL not found')
    }
    
    console.log('Using sales channel URL:', salesChannelUrl)
    
    // Call BOB API using salesOffer module and soubory module (same as old PHP version)
    const modules = [
      {
        module: "kastomi",
        method: "salesOffer",
        key: `get_salesOffer_${Date.now()}`,
        data: {
          url: salesChannelUrl
        }
      },
      {
        module: "kastomi", 
        method: "soubory",
        key: `get_soubory_${Date.now()}`,
        data: {
          url: salesChannelUrl
        }
      }
    ]
    
    const { data: bobResponse, error: bobError } = await supabaseClient.functions.invoke('bob-api', {
      body: { modules },
      headers: { Authorization: authHeader }
    })

    if (bobError) throw bobError

    // Extract data from BOB API response
    const salesOfferData = bobResponse?.modules?.[0]?.data || []
    const filesData = bobResponse?.modules?.[1]?.data || []
    
    // Build image maps from files data (soubory)
    // Note: The path already includes "files/" prefix from BOB
    const imageByRelaceId = {} // Map images by relace_id for main images
    const variantImagesByTag = {} // Map images by tag for variant images
    
    // Debug: Log all file types we receive
    const fileTypes = new Set()
    filesData.forEach(f => fileTypes.add(f.typ))
    console.log("Available file types in soubory:", Array.from(fileTypes))
    
    // Debug: Log sample files data structure
    if (filesData.length > 0) {
      console.log("Sample file data:", JSON.stringify(filesData.slice(0, 5), null, 2))
    }
    
    for (const file of filesData) {
      // Process image path
      let imagePath = file.cesta || file.path || ''
      if (imagePath.startsWith('files/')) {
        imagePath = imagePath.substring(6) // Remove "files/" prefix
      }
      
      // URL encode the image path to handle spaces and special characters
      imagePath = imagePath.split('/').map(part => encodeURIComponent(part)).join('/')
      
      // Main product images
      if (file.relace_id && file.typ === 'hlavni_obrazek') {
        imageByRelaceId[file.relace_id] = imagePath
      }
      
      // Variant images - stored with typ = 'obrazek[]' and linked via tag field
      if (file.typ === 'obrazek[]' && file.tag) {
        // The tag field contains the variant identifier
        variantImagesByTag[file.tag] = imagePath
        console.log(`Found variant image: tag="${file.tag}", path="${imagePath}", relace_id="${file.relace_id}"`)
      }
    }
    
    // Debug: Log which IDs have images
    console.log("Image mapping summary:", {
      mainImages: Object.keys(imageByRelaceId).length,
      variantImages: Object.keys(variantImagesByTag).length,
      sampleMainMappings: Object.entries(imageByRelaceId).slice(0, 3).map(([id, path]) => ({ id, path })),
      sampleVariantMappings: Object.entries(variantImagesByTag).slice(0, 3).map(([tag, path]) => ({ tag, path }))
    })
    
    // Log summary
    console.log("BOB API Summary:", {
      club: clubData.name,
      offers: salesOfferData.length,
      totalVariants: salesOfferData.reduce((sum, o) => sum + (o.variants?.length || 1), 0),
      mainImages: Object.keys(imageByRelaceId).length,
      variantImagesByTag: Object.keys(variantImagesByTag).length,
      offersWithImages: salesOfferData.filter(o => imageByRelaceId[o.id]).length
    })

    // Debug: Log sample offer with variants to understand structure
    if (salesOfferData.length > 0 && salesOfferData[0].variants) {
      const firstVariant = salesOfferData[0].variants?.[0]
      console.log("Sample offer with variants:", {
        offerId: salesOfferData[0].id,
        offerName: salesOfferData[0].name,
        variantCount: salesOfferData[0].variants?.length,
        firstVariantId: firstVariant?.id,
        firstVariantName: firstVariant?.name || firstVariant?.variant,
        hasParams: !!firstVariant?.params,
        paramsCount: firstVariant?.params?.length,
        sampleParams: firstVariant?.params?.slice(0, 3).map(p => ({
          name: p.param?.name,
          internal: p.param?.internal,
          val: p.val
        }))
      })
    }
    
    // salesOffer module returns offers directly, not variants
    // Transform the data to match expected structure and add images
    const offers = salesOfferData.map(item => {
      // Get image for this offer by its ID
      const offerImage = imageByRelaceId[item.id] || ''
      
      // If the offer has variants array, use it; otherwise create a single variant
      const variants = item.variants && Array.isArray(item.variants) ? 
        item.variants.map((v, idx) => {
          let variantImage = null
          
          // First check if variant has params array with SalesOfferVariantImage
          if (v.params && Array.isArray(v.params)) {
            const imageParam = v.params.find(p => 
              p.param?.name === 'SalesOfferVariantImage' || 
              p.param?.internal === 'SalesOfferVariantImage'
            )
            if (imageParam && imageParam.val) {
              // The value is the image path
              let imagePath = imageParam.val
              // Remove "files/" prefix if present
              if (imagePath.startsWith('files/')) {
                imagePath = imagePath.substring(6)
              }
              // URL encode the path
              variantImage = imagePath.split('/').map(part => encodeURIComponent(part)).join('/')
              console.log(`Found variant image from SalesOfferVariantImage param for variant ${v.id}:`, variantImage)
            }
          }
          
          // If no image from params, try tag-based mapping
          if (!variantImage) {
            // Try different possible tag formats
            const possibleTags = [
              v.name,           // Variant name
              v.variant,        // Variant field
              v.color,          // Color field
              v.tag,            // Direct tag field if exists
              `${item.id}_${v.name}`, // Combination of offer ID and variant name
              `${item.id}_${v.color}`, // Combination of offer ID and color
            ].filter(Boolean) // Remove null/undefined values
            
            // Find the first matching tag
            for (const tag of possibleTags) {
              if (variantImagesByTag[tag]) {
                variantImage = variantImagesByTag[tag]
                console.log(`Found variant image for variant ${v.id} using tag "${tag}":`, variantImage)
                break
              }
            }
          }
          
          // Fall back to main offer image if no variant-specific image found
          if (!variantImage) {
            variantImage = offerImage
          }
          
          return {
            variant_id: v.id || item.id,
            variant: v.name || v.variant || item.name,
            variant_size: v.size || '',
            variant_color: v.color || '',
            variant_dimensions: v.dimensions || '',
            variant_image: variantImage,
            stock: v.stock || 0,
            active: item.active,
            active_channel: item.active_channel,
            price: item.price,
            wholesale_price: item.wholesale_price,
            sales_offer_name: item.name,
            created_at: v.created || item.created,
            updated_at: v.updated || item.updated
          }
        }) : [{
          // Single variant created from offer - still check for variant images by tag
          variant_id: item.id,
          variant: item.name,
          variant_size: '',
          variant_color: '',
          variant_dimensions: '',
          variant_image: variantImagesByTag[item.name] || offerImage,
          stock: 0,
          active: item.active,
          active_channel: item.active_channel,
          price: item.price,
          wholesale_price: item.wholesale_price,
          sales_offer_name: item.name,
          created_at: item.created,
          updated_at: item.updated
        }]
      
      return {
        id: item.id,
        sales_offer_id: item.id,
        sales_offer_name: item.name,
        sales_offer_text: item.text || '',
        seo: item.seo,
        wholesale_price: item.wholesale_price,
        price: item.price,
        active_channel: item.active_channel,
        active: item.active,
        sales_offer_status_id: item.sales_offer_status_id,
        variants: variants
      }
    })

    // Log first offer with image to debug
    const firstOfferWithImage = offers.find(o => o.variants[0]?.variant_image)
    if (firstOfferWithImage) {
      console.log("First offer with image being sent to frontend:", {
        id: firstOfferWithImage.id,
        name: firstOfferWithImage.sales_offer_name,
        firstVariantImage: firstOfferWithImage.variants[0].variant_image
      })
    }
    
    // Format offers for frontend
    const formattedOffers = offers.map(offer => {
      // Get price from offer level
      const wholesalePrice = Number(offer.wholesale_price) || 0
      const finalPrice = Number(offer.price) || 0
      const klubPrice = finalPrice - wholesalePrice
      
      // Get active status from offer level - salesOffer module provides it at offer level
      // active_channel is the club-specific status (what we show in the UI)
      // active is the general product status
      const activeChannel = offer.active_channel !== undefined ? Number(offer.active_channel) : 0
      const active = offer.active !== undefined ? Number(offer.active) : 1
      
      
      return {
      id: offer.sales_offer_id,
      name: offer.sales_offer_name || '',
      seo: offer.seo || '',
      sales_offer_text: offer.sales_offer_text || '',
      wholesale_price: wholesalePrice,
      price: finalPrice,
      klub_price: klubPrice,
      // Use the active values from offer level
      active_channel: activeChannel,
      active: active,
      sales_offer_status_id: offer.sales_offer_status_id || 1,
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
        variant_image: v.variant_image || '',  // Changed from 'image' to 'variant_image'
        // Prices are same for all variants of an offer
        wholesale_price: wholesalePrice,
        price: finalPrice,
        klub_price: klubPrice,
        stock: v.stock || 0,
        active: active, // Use the numeric active value
        active_channel: activeChannel,
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