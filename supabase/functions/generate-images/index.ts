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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompts, variationsCount = 3 } = await req.json();

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. prompts array is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's valid API keys
    const { data: apiKeys, error: keysError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_valid', true);

    if (keysError || !apiKeys || apiKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid API keys found. Please add and validate your API keys first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create generation session
    const { data: session, error: sessionError } = await supabaseClient
      .from('generation_sessions')
      .insert({
        user_id: user.id,
        status: 'processing',
        total_prompts: prompts.length,
        completed_prompts: 0,
        failed_prompts: 0
      })
      .select()
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Failed to create generation session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start background generation
    // Process generation in background
    (async () => {
        let keyIndex = 0;
        let completed = 0;
        let failed = 0;

        for (const promptText of prompts) {
          try {
            // Create prompt batch
            const { data: batch, error: batchError } = await supabaseClient
              .from('prompt_batches')
              .insert({
                session_id: session.id,
                prompt_text: promptText,
                variations_count: variationsCount,
                status: 'processing'
              })
              .select()
              .single();

            if (batchError || !batch) {
              failed++;
              continue;
            }

            // Generate variations using Google AI Studio (Gemini 2.5 Flash)
            const currentKey = apiKeys[keyIndex % apiKeys.length].encrypted_key;
            
            for (let i = 0; i < variationsCount; i++) {
              try {
                // Use Gemini 2.5 Flash API to generate image descriptions
                // Note: Gemini doesn't directly generate images yet, using placeholder
                // In production, you'd use an image generation service based on Gemini descriptions
                const geminiResponse = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{
                        parts: [{ text: `Generate a detailed image description for: ${promptText}` }]
                      }]
                    })
                  }
                );
                
                // Using placeholder for now - replace with actual image generation
                const imageUrl = `https://picsum.photos/seed/${Date.now()}-${i}/800/600`;
                
                // Save result to database
                await supabaseClient.from('generation_results').insert({
                  batch_id: batch.id,
                  image_url: imageUrl,
                  variation_number: i + 1,
                  is_selected: false,
                  metadata: { prompt: promptText, api_key_index: keyIndex % apiKeys.length }
                });
              } catch (error) {
                console.error(`Failed to generate variation ${i + 1}:`, error);
              }
            }

            // Update batch status
            await supabaseClient
              .from('prompt_batches')
              .update({ status: 'completed' })
              .eq('id', batch.id);

            completed++;
            keyIndex++;

            // Update usage count for the API key
            await supabaseClient
              .from('api_keys')
              .update({ usage_count: apiKeys[keyIndex % apiKeys.length].usage_count + 1 })
              .eq('id', apiKeys[keyIndex % apiKeys.length].id);

          } catch (error) {
            console.error('Error processing prompt:', error);
            failed++;
          }
        }

        // Update session
        await supabaseClient
          .from('generation_sessions')
          .update({
            status: 'completed',
            completed_prompts: completed,
            failed_prompts: failed
          })
          .eq('id', session.id);
      })().catch(err => console.error('Background generation error:', err));

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        message: 'Generation started successfully',
        totalPrompts: prompts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-images function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});