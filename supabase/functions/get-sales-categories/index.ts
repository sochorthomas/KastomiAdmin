import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { sales_channel_url } = await req.json();
    
    if (!sales_channel_url) {
      return new Response(JSON.stringify({ error: 'Sales channel URL is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Extract sales channel ID from URL
    const urlParts = sales_channel_url.split("/");
    const salesChannelId = urlParts[urlParts.length - 1];

    // Call BOB API for categories
    const module = {
      module: "kastomi",
      method: "salesCategory",
      key: `get_salesCategory_${Date.now()}`
    };

    const baseUrl = 'https://bob.kastomi.com/v2/kastomiApi';
    const url = `${baseUrl}/${encodeURIComponent(JSON.stringify(module))}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`BOB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Categories are typically returned directly from the API
    const categories = data || [];

    return new Response(JSON.stringify({ 
      categories: categories,
      success: true 
    }), {
      headers: corsHeaders,
      status: 200
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: corsHeaders,
      status: 500
    });
  }
});