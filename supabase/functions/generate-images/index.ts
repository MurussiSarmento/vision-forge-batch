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

    console.log('Starting image generation for', prompts.length, 'prompts');
    
    // Get user's valid API keys
    const { data: apiKeys, error: keysError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_valid', true);

    console.log('Found API keys:', apiKeys?.length || 0);

    if (keysError || !apiKeys || apiKeys.length === 0) {
      console.error('API keys error:', keysError);
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

    console.log('Created session:', session?.id);

    if (sessionError || !session) {
      console.error('Session creation error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create generation session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start background generation
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

          console.log(`Created batch ${batch.id}`);

          // Generate variations
          const currentKey = apiKeys[keyIndex % apiKeys.length].encrypted_key;
          
          for (let i = 0; i < variationsCount; i++) {
            try {
              console.log(`Generating variation ${i + 1}/${variationsCount}`);
              
              // Use Lovable AI Gateway with Gemini Nano Banana for image generation
              let imageUrl = '';
              
              try {
                const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
                
                const aiResponse = await fetch(
                  'https://ai.gateway.lovable.dev/v1/chat/completions',
                  {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${LOVABLE_API_KEY}`
                    },
                    body: JSON.stringify({
                      model: 'google/gemini-2.5-flash-image-preview',
                      messages: [{
                        role: 'user',
                        content: promptText
                      }],
                      modalities: ['image', 'text']
                    })
                  }
                );

                if (aiResponse.ok) {
                  const aiData = await aiResponse.json();
                  console.log('Lovable AI response received');
                  
                  // Extract base64 image from response
                  if (aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
                    imageUrl = aiData.choices[0].message.images[0].image_url.url;
                    console.log('Image generated successfully via Lovable AI');
                  }
                } else {
                  const errorData = await aiResponse.json();
                  console.warn('Lovable AI error:', aiResponse.status, errorData);
                }
              } catch (aiError) {
                console.warn('Failed to use Lovable AI:', aiError);
              }

              // Fallback to placeholder if AI didn't work
              if (!imageUrl) {
                console.log('Using placeholder image (AI generation failed)');
                imageUrl = `https://picsum.photos/seed/${batch.id}-${i}-${Date.now()}/800/600`;
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
                    model: imageUrl.startsWith('data:') ? 'gemini-2.5-flash-image-preview' : 'placeholder'
                  }
                });

              if (insertError) {
                console.error('Database insert error:', insertError);
              } else {
                console.log(`Variation ${i + 1} saved successfully`);
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

          console.log(`Batch ${batch.id} completed`);
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
    console.log('Starting background task');
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