import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
};

serve(async (req) => {
  console.log("[get-order-items] Request received:", req.method);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: corsHeaders
    });
  }
  
  try {
    console.log("[get-order-items] Processing POST request");
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    console.log("[get-order-items] Auth header present:", !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log("[get-order-items] Supabase URL:", supabaseUrl);
    console.log("[get-order-items] Service key present:", !!supabaseKey);
    
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    )

    // Get and validate the user
    const authToken = authHeader.replace('Bearer ', '')
    console.log("[get-order-items] Getting user from token");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError) {
      console.error("[get-order-items] User error:", userError);
      throw new Error(`Auth error: ${userError.message}`)
    }
    
    if (!user) {
      console.error("[get-order-items] No user found");
      throw new Error('Unauthorized')
    }
    
    console.log("[get-order-items] User authenticated:", user.id);

    // Get user's profile to verify they have a valid club
    console.log("[get-order-items] Fetching user profile");
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('user_profiles')
      .select('club_id')
      .eq('auth_id', user.id)
      .single()

    if (userDataError) {
      console.error("[get-order-items] User profile error:", userDataError);
      throw new Error(`Profile error: ${userDataError.message}`)
    }
    
    if (!userData || !userData.club_id) {
      console.error("[get-order-items] No user data or club_id:", userData);
      throw new Error('User profile not found or no club assigned')
    }
    
    console.log("[get-order-items] User club_id:", userData.club_id);

    // Parse request body
    const requestBody = await req.json();
    console.log("[get-order-items] Request body:", requestBody);
    
    const { order_id, sales_channel_id } = requestBody;
    
    if (!order_id) {
      throw new Error('Order ID is required')
    }
    
    console.log("[get-order-items] Fetching items for order:", order_id);
    console.log("[get-order-items] Sales channel ID from request:", sales_channel_id);
    
    // Use the sales_channel_id from the request (which equals club_id)
    // or fall back to the user's club_id from their profile
    const channelId = sales_channel_id || userData.club_id;
    console.log("[get-order-items] Using channel/club ID:", channelId);
    
    // Call bob-report function to get order items
    // Using report ID 26 as found in the old implementation
    console.log("[get-order-items] Calling bob-report with reportId: 26, value:", channelId);
    
    try {
      // We need to create a properly authenticated request to bob-report
      // The bob-report function expects the Authorization header to be passed
      const bobReportUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/bob-report`;
      
      console.log("[get-order-items] Calling bob-report at:", bobReportUrl);
      
      const bobResponse = await fetch(bobReportUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader, // Pass the original auth header
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: 26,
          value: channelId
        })
      });
      
      console.log("[get-order-items] Bob-report response status:", bobResponse.status);
      
      if (!bobResponse.ok) {
        const errorText = await bobResponse.text();
        console.error("[get-order-items] Bob-report error response:", errorText);
        throw new Error(`Bob-report failed with status ${bobResponse.status}: ${errorText}`);
      }
      
      const reportData = await bobResponse.json();
      
      console.log("[get-order-items] Report data received:", {
        hasData: !!reportData,
        dataLength: reportData?.data?.length || 0
      });
    
      // Filter the report data to only include items for the requested order
      const allOrderItems = reportData?.data || []
      console.log(`[get-order-items] Total items from report: ${allOrderItems.length}`);
      
      // Log first item structure for debugging
      if (allOrderItems.length > 0) {
        console.log("[get-order-items] First item structure:", Object.keys(allOrderItems[0]));
        console.log("[get-order-items] Sample item:", JSON.stringify(allOrderItems[0], null, 2));
        
        // Log some order IDs to understand the data format
        const sampleOrderIds = allOrderItems.slice(0, 5).map(item => ({
          'ID objednávky': item['ID objednávky'],
          'order_id': item.order_id,
          'id': item.id
        }));
        console.log("[get-order-items] Sample order IDs from data:", sampleOrderIds);
        console.log("[get-order-items] Looking for order_id:", order_id);
      }
      
      // Report 26 returns order items with 'ID objednávky' field being the order ID
      // Based on the SQL: objednavka.order_id AS "ID objednávky"
      const orderItems = allOrderItems.filter(item => {
        // The field name from the SQL is "ID objednávky" (Order ID in Czech)
        // Try different possible field names and formats
        const possibleOrderIds = [
          item['ID objednávky'],
          item['ID objednavky'], // Without accent
          item.order_id,
          item.id
        ].filter(Boolean).map(id => String(id).trim());
        
        const targetOrderId = String(order_id).trim();
        
        // Check if any of the possible IDs match
        const matches = possibleOrderIds.some(id => id === targetOrderId);
        
        if (matches) {
          console.log(`[get-order-items] Found matching item for order ${order_id}:`, {
            itemName: item['Název položky'],
            orderId: item['ID objednávky']
          });
        }
        
        return matches;
      });
      
      console.log(`[get-order-items] Filtered items for order ${order_id}: ${orderItems.length}`);
    
    // Transform the data to match our expected format
    // Based on report 26 SQL results from the query provided:
    // We have these fields in Czech:
    const transformedItems = orderItems.map((item, index) => {
      console.log(`[get-order-items] Transforming item ${index + 1}:`, {
        name: item['Název položky'],
        orderId: item['ID objednávky']
      });
      
      // Parse quantity - it might be a number or string
      let quantity = 1;
      const quantityField = item['Počet'] || item['Množství'] || item['quantity'] || '1';
      if (quantityField) {
        quantity = parseInt(String(quantityField)) || 1;
      }
      
      // Parse price - it might be a number or string with currency
      let price = 0;
      const priceField = item['Cena'] || item['price'] || '0';
      if (priceField) {
        // Remove any currency symbols and parse
        const cleanPrice = String(priceField).replace(/[^\d.,]/g, '').replace(',', '.');
        price = parseFloat(cleanPrice) || 0;
      }
      
      return {
        // Primary identifiers
        id: item['ID položky'] || item['ID polozky'] || item['item_id'] || `${order_id}_${index}`,
        order_id: item['ID objednávky'] || item['ID objednavky'] || order_id,
        
        // Product information
        name: item['Název položky'] || item['Nazev polozky'] || item['name'] || '',
        variant: item['Varianta'] || item['Velikost'] || item['variant'] || '',
        sku: item['SKU'] || item['Kód'] || item['Kod'] || item['sku'] || '',
        
        // Quantities and pricing
        quantity: quantity,
        price: price,
        
        // Order information  
        date: item['Datum objednávky'] || item['Datum objednavky'] || item['date'] || '',
        paid: item['Zaplaceno'] === 'ano' || item['Zaplaceno'] === 1 || item['paid'] === true,
        cancelled: item['Storno'] === 'ano' || item['Storno'] === 1 || item['cancelled'] === true,
        
        // Customer information
        customer_name: item['Jméno'] || item['Jmeno'] || item['Zákazník'] || item['Zakaznik'] || '',
        customer_email: item['Email'] || item['email'] || '',
        customer_phone: item['Telefon'] || item['phone'] || '',
        
        // Additional fields
        customization: item['Kastomizace'] || item['customization'] || '',
        image: item['Obrázek'] || item['Obrazek'] || item['image'] || null,
        
        // Include raw data for debugging (you can remove this in production)
        _raw: undefined // Set to item if you need to debug the raw data
      };
    })
    
      console.log(`[get-order-items] Returning ${transformedItems.length} transformed items`);
      
      return new Response(JSON.stringify({
        success: true,
        items: transformedItems,
        count: transformedItems.length
      }), {
        status: 200,
        headers: corsHeaders
      });
    } catch (reportErr) {
      console.error("[get-order-items] Error calling bob-report:", reportErr);
      throw new Error(`Report call failed: ${reportErr.message}`);
    }
    
  } catch (e) {
    console.error("[get-order-items] Error:", e.message);
    console.error("[get-order-items] Stack:", e.stack);
    
    const status = e.message === 'Unauthorized' || e.message === 'No authorization header' ? 401 : 
                   e.message === 'User profile not found or no club assigned' ? 403 : 500
    
    return new Response(JSON.stringify({
      error: e.message,
      details: e.stack
    }), {
      status: status,
      headers: corsHeaders
    });
  }
});