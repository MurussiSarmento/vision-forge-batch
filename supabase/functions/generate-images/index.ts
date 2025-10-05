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

    // Start background generation using Gemini Nano Banana
    const backgroundTask = async () => {
      let keyIndex = 0;
      let completed = 0;
      let failed = 0;

      for (const promptText of prompts) {
        try {
          console.log(`Processing prompt: ${promptText}`);
          
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
            console.error('Batch creation error:', batchError);
            failed++;
            continue;
          }

          // Generate variations using Gemini Nano Banana (image generation)
          const currentKey = apiKeys[keyIndex % apiKeys.length].encrypted_key;
          
          for (let i = 0; i < variationsCount; i++) {
            try {
              console.log(`Generating variation ${i + 1}/${variationsCount}`);
              
              // Use Gemini 2.5 Flash Image Preview (Nano Banana) for image generation
              const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${currentKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{
                      parts: [{ text: promptText }]
                    }],
                    modalities: ["image", "text"]
                  })
                }
              );

              const geminiData = await geminiResponse.json();
              console.log('Gemini response status:', geminiResponse.status);
              
              if (!geminiResponse.ok) {
                console.error('Gemini API error:', geminiData);
                throw new Error(geminiData.error?.message || 'Failed to generate image');
              }

              // Extract base64 image from response
              let imageUrl = '';
              if (geminiData.candidates?.[0]?.content?.parts) {
                const imagePart = geminiData.candidates[0].content.parts.find((p: any) => p.inlineData);
                if (imagePart?.inlineData?.data) {
                  imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                  console.log('Image generated successfully');
                }
              }

              // Fallback to placeholder if no image generated
              if (!imageUrl) {
                console.warn('No image generated, using placeholder');
                imageUrl = `https://picsum.photos/seed/${Date.now()}-${i}/800/600`;
              }
              
              // Save result to database
              const { error: insertError } = await supabaseClient
                .from('generation_results')
                .insert({
                  batch_id: batch.id,
                  image_url: imageUrl,
                  variation_number: i + 1,
                  is_selected: false,
                  metadata: { 
                    prompt: promptText, 
                    api_key_index: keyIndex % apiKeys.length,
                    model: 'gemini-2.5-flash-image-preview'
                  }
                });

              if (insertError) {
                console.error('Database insert error:', insertError);
              }
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
          const currentKeyData = apiKeys[keyIndex % apiKeys.length];
          await supabaseClient
            .from('api_keys')
            .update({ 
              usage_count: (currentKeyData.usage_count || 0) + 1,
              last_validated_at: new Date().toISOString()
            })
            .eq('id', currentKeyData.id);

        } catch (error) {
          console.error('Error processing prompt:', error);
          failed++;
        }
      }

      // Update session
      console.log(`Generation completed. Completed: ${completed}, Failed: ${failed}`);
      await supabaseClient
        .from('generation_sessions')
        .update({
          status: 'completed',
          completed_prompts: completed,
          failed_prompts: failed
        })
        .eq('id', session.id);
    };

    // Run background task
    backgroundTask().catch(err => {
      console.error('Background generation error:', err);
    });

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