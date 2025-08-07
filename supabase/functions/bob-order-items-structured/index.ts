import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Parse HTML table to extract structured data
function parseOrderItemsHtml(html: string): any {
  const products = []
  let shipping = null
  let totalClubSupport = 0
  let totalProductsPrice = 0
  let total = 0
  
  // Extract all table rows
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
  
  for (const rowMatch of rowMatches) {
    const rowContent = rowMatch[1]
    const rowClass = rowMatch[0].match(/class="([^"]*)"/)
    const isProductRow = rowClass && rowClass[1].includes('l')
    
    // Extract all cells from the row
    const cellMatches = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
    if (cellMatches.length === 0) continue
    
    // Get text content from cells (strip HTML tags)
    const cellTexts = cellMatches.map(match => {
      return match[1].replace(/<[^>]*>/g, '').trim()
    })
    
    // Process product rows (class 'l')
    if (isProductRow && cellTexts.length > 0) {
      const name = cellTexts[0] || ''
      
      // Check if it's a shipping row
      if (name.includes('DOPRAVA')) {
        const priceText = cellTexts[cellTexts.length - 1]
        const priceMatch = priceText.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.')) : 0
        
        shipping = {
          name: name,
          price: price,
          priceFormatted: priceText
        }
      } else if (name && !name.includes('Celkem')) {
        // It's a product row
        const priceText = cellTexts[cellTexts.length - 1]
        const priceMatch = priceText.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.')) : 0
        
        // Check if there's club support in a separate column
        let klubSupport = 0
        if (cellTexts.length > 4) {
          const klubText = cellTexts[cellTexts.length - 2]
          const klubMatch = klubText.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
          if (klubMatch) {
            klubSupport = parseFloat(klubMatch[1].replace(/\s/g, '').replace(',', '.'))
            totalClubSupport += klubSupport
          }
        }
        
        products.push({
          name: cellTexts[0],
          variant: cellTexts[1] || '',
          quantity: cellTexts[2] || '',
          klubSupport: klubSupport,
          price: price,
          priceFormatted: priceText
        })
        
        totalProductsPrice += price
      }
    }
    
    // Check for total row
    if (cellTexts.some(text => text.includes('Celkem'))) {
      const totalText = cellTexts[cellTexts.length - 1]
      const totalMatch = totalText.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
      if (totalMatch) {
        total = parseFloat(totalMatch[1].replace(/\s/g, '').replace(',', '.'))
      }
    }
  }
  
  // If we couldn't find the total, try to find it in bold tags
  if (total === 0) {
    const boldMatches = html.matchAll(/<b[^>]*>([\s\S]*?)<\/b>/gi)
    for (const match of boldMatches) {
      const text = match[1]
      const priceMatch = text.match(/([\d\s]+(?:,\d+)?)\s*Kč/)
      if (priceMatch) {
        const value = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'))
        if (value > total) total = value
      }
    }
  }
  
  // Calculate total if not found
  if (total === 0) {
    total = totalProductsPrice + (shipping?.price || 0) + totalClubSupport
  }
  
  return {
    products,
    shipping,
    clubSupport: totalClubSupport,
    totalProductsPrice,
    total,
    html // Keep original HTML for backward compatibility
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { objednavka_id } = await req.json()

    if (!objednavka_id) {
      return new Response(
        JSON.stringify({ error: 'objednavka_id is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Call the BOB API endpoint
    const formData = new URLSearchParams()
    formData.append('objednavka_id', objednavka_id.toString())

    const response = await fetch('https://bob.kastomi.com/funkce/list-polozky', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    // Get the response text
    const responseText = await response.text()

    // Parse the HTML to extract structured data
    const structuredData = parseOrderItemsHtml(responseText)

    return new Response(
      JSON.stringify({
        success: true,
        data: structuredData,
        status: response.status,
        statusText: response.statusText,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error calling BOB API:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch order items',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})