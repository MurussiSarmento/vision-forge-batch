import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Validating keys for user:', user.id, user.email);

    const { apiKeys } = await req.json();

    if (!apiKeys || !Array.isArray(apiKeys)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. apiKeys array is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.all(
      apiKeys.map(async (key: string) => {
        try {
          // Validate using Google AI Studio API (Gemini 2.5 Flash)
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: "Hello" }]
                }]
              })
            }
          );

          const data = await response.json();
          const isValid = !data.error && response.ok;

          return {
            key: `${key.substring(0, 10)}...`,
            fullKey: key,
            valid: isValid,
            message: isValid ? 'Chave de API válida' : data.error?.message || 'Chave inválida ou expirada'
          };
        } catch (error) {
          return {
            key: `${key.substring(0, 10)}...`,
            fullKey: key,
            valid: false,
            message: 'Falha ao validar a chave'
          };
        }
      })
    );

    // Save valid keys to database
    const validKeys = results.filter(r => r.valid);
    console.log(`Found ${validKeys.length} valid keys to save for user ${user.id}`);
    
    if (validKeys.length > 0) {
      // First, check if keys already exist for this user
      const { data: existingKeys } = await supabaseClient
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', user.id);
      
      console.log(`User ${user.id} has ${existingKeys?.length || 0} existing keys`);
      
      const keysToInsert = validKeys.map((k, index) => ({
        user_id: user.id,
        key_name: `Key ${Date.now()}-${index}`,
        encrypted_key: k.fullKey,
        is_valid: true,
        last_validated_at: new Date().toISOString()
      }));
      
      console.log('Inserting keys:', keysToInsert.map(k => ({ 
        user_id: k.user_id, 
        key_preview: k.encrypted_key.substring(0, 10) 
      })));

      const { error: dbError } = await supabaseClient
        .from('api_keys')
        .upsert(keysToInsert, { 
          onConflict: 'user_id,encrypted_key',
          ignoreDuplicates: false 
        });

      if (dbError) {
        console.error('Database error saving keys:', dbError);
      } else {
        console.log(`Successfully saved ${validKeys.length} keys for user ${user.id}`);
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-api-keys function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});