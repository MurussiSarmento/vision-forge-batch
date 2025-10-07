import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script, feedback, previousCharacters } = await req.json();

    console.log('Generating characters from script...');

    // Get character generation link from system config
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: configData, error: configError } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'character_gen_link')
      .single();

    if (configError || !configData?.config_value) {
      console.error('Character gen link not configured:', configError);
      return new Response(
        JSON.stringify({ error: 'Link de geração de personagens não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const characterGenLink = configData.config_value;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build prompt for character extraction
    let userMessage = '';
    if (feedback && previousCharacters) {
      userMessage = `Roteiro:\n${script}\n\nPersonagens anteriores:\n${JSON.stringify(previousCharacters, null, 2)}\n\nFeedback do cliente:\n${feedback}\n\nPor favor, regenere os personagens considerando o feedback fornecido.`;
    } else {
      userMessage = `Analise o seguinte roteiro de vídeo e extraia todos os personagens que aparecem:\n\n${script}\n\nPara cada personagem, retorne um JSON com a estrutura:\n{\n  "characters": [\n    {\n      "name": "Nome do personagem",\n      "description": "Descrição detalhada e visual do personagem para geração de imagem",\n      "role": "Papel do personagem no vídeo"\n    }\n  ]\n}\n\nA descrição deve ser rica em detalhes visuais (aparência física, roupas, expressão, etc.) para ser usada na geração de imagens.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de roteiros e extração de personagens. Retorne sempre um JSON válido com a estrutura solicitada.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to generate characters');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const charactersData = JSON.parse(jsonMatch[0]);
    console.log('Characters extracted:', charactersData);

    // Now generate 3 images for each character using the character gen link
    const charactersWithImages = await Promise.all(
      charactersData.characters.map(async (character: any) => {
        const images = [];
        
        for (let i = 0; i < 3; i++) {
          try {
            const imageResponse = await fetch(characterGenLink, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: character.description,
                variation: i + 1
              }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              images.push({
                url: imageData.image_url || imageData.url,
                variation: i + 1
              });
            }
          } catch (error) {
            console.error(`Error generating image ${i + 1} for ${character.name}:`, error);
          }
        }

        return {
          ...character,
          images
        };
      })
    );

    return new Response(
      JSON.stringify({ characters: charactersWithImages }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-characters function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
