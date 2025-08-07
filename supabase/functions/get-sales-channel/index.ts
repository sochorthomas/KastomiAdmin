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

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the token
    const authToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authToken)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's club information - join on bob_id
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('user_profiles')
      .select('club_id')
      .eq('auth_id', user.id)
      .single()
    
    if (userDataError || !userData) {
      console.error('User profile query error:', {
        error: userDataError,
        userId: user.id
      })
      return new Response(
        JSON.stringify({ 
          salesChannel: {
            id: null,
            name: "Nenalezeno",
            bob_id: null,
            url: null,
            logo: null,
            favicon: null
          },
          debug: {
            reason: 'no_user_profile',
            error: userDataError?.message,
            userId: user.id
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    // Now get club by bob_id
    const { data: clubData, error: clubError } = await supabaseAdmin
      .from('clubs')
      .select('id, name, bob_id, internal')
      .eq('bob_id', userData.club_id)
      .single()

    if (clubError || !clubData) {
      console.error('Club query error:', {
        error: clubError,
        clubId: userData.club_id,
        userId: user.id
      })
      return new Response(
        JSON.stringify({ 
          salesChannel: {
            id: null,
            name: "Nenalezeno",
            bob_id: null,
            url: null,
            logo: null,
            favicon: null
          },
          debug: {
            reason: 'no_club_found',
            error: clubError?.message,
            club_id: userData.club_id,
            userId: user.id
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const club = clubData
    
    console.log('Club data:', {
      id: club.id,
      name: club.name,
      bob_id: club.bob_id,
      internal: club.internal
    })
    
    // If no internal ID, return basic club info
    if (!club.internal) {
      console.warn('No internal ID for club:', club)
      return new Response(
        JSON.stringify({ 
          salesChannel: {
            id: club.id,
            name: club.name,
            bob_id: club.bob_id,
            url: null,
            logo: null,
            favicon: null
          },
          debug: {
            reason: 'no_internal_id',
            club: {
              id: club.id,
              name: club.name,
              bob_id: club.bob_id
            }
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create Supabase client for calling bob-report
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    console.log('Calling BOB report with:', {
      reportId: 14,
      internal: club.internal
    })
    
    // Call bob-report function to get sales channel data
    const { data: bobData, error: bobError } = await supabaseClient.functions.invoke('bob-report', {
      body: {
        reportId: 14, // The report ID for sales channel data
        value: club.internal
      },
      headers: { Authorization: authHeader }
    })

    if (bobError) {
      console.error('BOB report error:', bobError)
      throw bobError
    }

    console.log('BOB report response:', JSON.stringify(bobData, null, 2))

    // Check if we have valid data
    if (!bobData || !bobData.data) {
      console.error('Invalid BOB report response structure:', bobData)
      throw new Error('Invalid BOB report response')
    }

    // Extract sales channel data from BOB response
    // The data is an array, and we need the first item
    if (!Array.isArray(bobData.data) || bobData.data.length === 0) {
      console.warn('No data returned from BOB report for internal ID:', club.internal)
      // Return basic info from club table
      return new Response(
        JSON.stringify({ 
          salesChannel: {
            id: club.id,
            name: club.name,
            bob_id: club.bob_id,
            url: null,
            logo: null,
            favicon: null
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    const salesChannelData = bobData.data[0]
    
    console.log('Extracted sales channel data:', JSON.stringify(salesChannelData, null, 2))
    console.log('Looking for URL in fields:', {
      url: salesChannelData.url,
      domain: salesChannelData.domain,
      domena: salesChannelData.domena,
      web: salesChannelData.web,
      adresa: salesChannelData.adresa
    })

    // The URL might be in different fields - check common patterns
    const url = salesChannelData.url || 
                salesChannelData.domain || 
                salesChannelData.domena || 
                salesChannelData.web ||
                salesChannelData.adresa ||
                null

    // Format response - use multiple possible field names
    const result = {
      id: salesChannelData.id || club.bob_id,
      name: salesChannelData.nazev || salesChannelData.name || salesChannelData.title || club.name,
      bob_id: club.bob_id,
      url: url,
      logo: salesChannelData.logo || salesChannelData.soubory?.logo?.cesta || null,
      favicon: salesChannelData.favicon || salesChannelData.soubory?.favicon?.cesta || null
    }
    
    // If we still don't have a URL and we have a name, try to construct it
    if (!result.url && result.name && result.name !== club.name) {
      // Sometimes the sales channel name contains the domain
      const possibleDomain = result.name.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9.-]/g, '');
      if (possibleDomain.includes('.')) {
        result.url = possibleDomain.startsWith('http') ? possibleDomain : `https://${possibleDomain}`;
      }
    }
    
    console.log('Formatted result:', JSON.stringify(result, null, 2))

    return new Response(
      JSON.stringify({ salesChannel: result }),
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
        status: error.message === 'Unauthorized' ? 401 : 500
      }
    )
  }
})