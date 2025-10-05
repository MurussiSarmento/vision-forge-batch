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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
          // Validate using Google AI Studio API (Gemini)
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: "Test" }]
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
    if (validKeys.length > 0) {
      const { error: dbError } = await supabaseClient
        .from('api_keys')
        .upsert(
          validKeys.map((k, index) => ({
            user_id: user.id,
            key_name: `Key ${index + 1}`,
            encrypted_key: k.fullKey,
            is_valid: true,
            last_validated_at: new Date().toISOString()
          })),
          { onConflict: 'user_id,encrypted_key' }
        );

      if (dbError) {
        console.error('Database error:', dbError);
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