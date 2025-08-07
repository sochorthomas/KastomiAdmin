import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Try to parse as JSON first
    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      // If not JSON, treat as HTML
      result = { html: responseText }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
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