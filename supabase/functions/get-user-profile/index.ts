import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const authToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    // Get user profile with club information
    const { data: profile, error: profileError } = await supabaseClient.from('user_profiles').select(`
        id,
        email,
        full_name,
        club_id,
        clubs (
          id,
          name,
          bob_id
        )
      `).eq('auth_id', user.id).single();
    if (profileError) {
      // If profile doesn't exist, create one
      const { data: newProfile, error: createError } = await supabaseClient.from('user_profiles').insert({
        auth_id: user.id,
        email: user.email,
        full_name: user.email?.split('@')[0] || 'User'
      }).select(`
          id,
          email,
          full_name,
          club_id,
          clubs (
            id,
            name,
            bob_id
          )
        `).single();
      if (createError) {
        throw createError;
      }
      return new Response(JSON.stringify({
        profile: newProfile
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      profile
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: error.message === 'Unauthorized' ? 401 : 500
    });
  }
});
