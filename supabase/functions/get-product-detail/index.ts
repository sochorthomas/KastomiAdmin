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
    const { seo } = await req.json()
    
    if (!seo) {
      throw new Error('SEO parameter is required')
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
    console.log('Looking for product with SEO:', seo)
    
    // Call BOB API using salesOffer module (like PHP version gets all and filters)
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
    
    // Find the product by SEO (like PHP version does)
    let productData = null
    for (const offer of salesOfferData) {
      if (offer.seo === seo) {
        productData = offer
        break
      }
    }
    
    if (!productData) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }
    
    // Build image maps from files data
    const imageByRelaceId = {} // Map images by relace_id for main images
    const variantImagesByTag = {} // Map images by tag for variant images
    const additionalImages = [] // Additional images for gallery
    
    for (const file of filesData) {
      // Process image path
      let imagePath = file.cesta || file.path || ''
      if (imagePath.startsWith('files/')) {
        imagePath = imagePath.substring(6) // Remove "files/" prefix
      }
      
      // URL encode the image path to handle spaces and special characters
      imagePath = imagePath.split('/').map(part => encodeURIComponent(part)).join('/')
      
      // Check if this file is related to our product
      // Convert both to strings for comparison
      const fileRelaceId = String(file.relace_id || '')
      const productId = String(productData.id || '')
      
      // Main product images
      if (fileRelaceId === productId) {
        if (file.typ === 'hlavni_obrazek') {
          imageByRelaceId[productId] = imagePath
        } else if (file.typ === 'obrazek[]') {
          additionalImages.push(imagePath)
        }
      }
      
      // Also check if relace_id matches any variant IDs
      if (productData.variants && Array.isArray(productData.variants)) {
        for (const variant of productData.variants) {
          if (fileRelaceId === String(variant.id)) {
            if (file.typ === 'hlavni_obrazek') {
              variantImagesByTag[variant.id] = imagePath
            }
          }
        }
      }
      
      // Variant images by tag
      if (file.typ === 'obrazek[]' && file.tag) {
        variantImagesByTag[file.tag] = imagePath
      }
    }
    
    // Get main image
    const mainImage = imageByRelaceId[String(productData.id)] || ''
    
    // Build images array for gallery
    const images = []
    if (mainImage) images.push(mainImage)
    images.push(...additionalImages)
    
    // Process variants if they exist
    const variants = productData.variants && Array.isArray(productData.variants) ? 
      productData.variants.map(v => {
        // Find variant image
        let variantImage = null
        
        // Check params for image
        if (v.params && Array.isArray(v.params)) {
          const imageParam = v.params.find(p => 
            p.param?.name === 'SalesOfferVariantImage' || 
            p.param?.internal === 'SalesOfferVariantImage'
          )
          if (imageParam && imageParam.val) {
            let imagePath = imageParam.val
            if (imagePath.startsWith('files/')) {
              imagePath = imagePath.substring(6)
            }
            variantImage = imagePath.split('/').map(part => encodeURIComponent(part)).join('/')
          }
        }
        
        // Try tag-based mapping if no param image
        if (!variantImage) {
          // First try by variant ID
          if (variantImagesByTag[String(v.id)]) {
            variantImage = variantImagesByTag[String(v.id)]
          } else {
            // Then try by other tags
            const possibleTags = [v.name, v.variant, v.color, v.tag].filter(Boolean)
            for (const tag of possibleTags) {
              if (variantImagesByTag[tag]) {
                variantImage = variantImagesByTag[tag]
                break
              }
            }
          }
        }
        
        // Fall back to main image
        if (!variantImage) {
          variantImage = mainImage
        }
        
        return {
          id: v.id || productData.id,
          variant: v.name || v.variant || productData.name,
          size: v.size || '',
          color: v.color || '',
          dimensions: v.dimensions || '',
          image: variantImage,
          stock: v.stock || 0,
          price: v.price || productData.price,
          params: v.params || []
        }
      }) : [{
        // Single variant from product
        id: productData.id,
        variant: productData.name,
        size: '',
        color: '',
        dimensions: '',
        image: mainImage,
        stock: productData.stock || 0,
        price: productData.price,
        params: productData.params || []
      }]
    
    // Extract visible parameters
    const params = []
    if (productData.params && Array.isArray(productData.params)) {
      for (const p of productData.params) {
        if (p.param?.show && p.val) {
          params.push({
            id: p.param.id,
            name: p.param.name,
            value: p.val,
            show: true
          })
        }
      }
    }
    
    // Format product for frontend
    const product = {
      id: productData.id,
      name: productData.name,
      seo: productData.seo,
      description: productData.text || '',
      wholesale_price: Number(productData.wholesale_price) || 0,
      price: Number(productData.price) || 0,
      klub_price: Number(productData.price) - Number(productData.wholesale_price) || 0,
      active_channel: productData.active_channel !== undefined ? Number(productData.active_channel) : 0,
      active: productData.active !== undefined ? Number(productData.active) : 1,
      sales_offer_status_id: productData.sales_offer_status_id || 1,
      main_image: mainImage,
      images: images,
      variants: variants,
      params: params,
      availability: productData.availability || 'Skladem',
      availability_color: productData.availability_color || '#10b981',
      categories: productData.kategorie || [],
      total_stock: variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    }

    return new Response(
      JSON.stringify({ product }),
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