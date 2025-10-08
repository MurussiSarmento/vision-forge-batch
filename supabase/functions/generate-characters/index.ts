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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Generate 3 images for each character using Lovable AI Gateway
    console.log('Starting image generation for characters...');
    console.log('Total characters to process:', charactersData.characters.length);
    
    const charactersWithImages = await Promise.all(
      charactersData.characters.map(async (character: any) => {
        console.log(`\n=== Processing character: ${character.name} ===`);
        const images = [];
        
        for (let i = 0; i < 3; i++) {
          let attempts = 0;
          const maxAttempts = 3;
          let success = false;

          while (attempts < maxAttempts && !success) {
            attempts++;
            try {
              console.log(`[${character.name}] Generating variation ${i + 1}/3 (attempt ${attempts}/${maxAttempts})`);
              
              const startTime = Date.now();
              
              // Enhanced prompt for 9:16 format and full body visibility
              const enhancedPrompt = `Crie uma imagem em formato VERTICAL (portrait 9:16 - mais alto que largo).

DESCRIÇÃO DO PERSONAGEM: ${character.description}

REQUISITOS OBRIGATÓRIOS DA IMAGEM:
- Formato: VERTICAL 9:16 (portrait orientation - altura muito maior que largura)
- Enquadramento: Corpo INTEIRO e COMPLETO do personagem
- Deve mostrar: cabeça completa (com espaço acima), tronco, braços completos, pernas completas e pés (com espaço abaixo)
- O personagem deve estar centralizado verticalmente
- Deixe margens adequadas acima da cabeça e abaixo dos pés
- A imagem deve ser vertical, não horizontal ou quadrada

ATENÇÃO: Se o personagem não aparecer COMPLETO (faltando cabeça, braços ou pés), a imagem está ERRADA.`;
              
              // Use Lovable AI Gateway with Gemini for image generation
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
                      content: [{ 
                        type: 'text', 
                        text: enhancedPrompt
                      }]
                    }],
                    modalities: ['image', 'text']
                  })
                }
              );

              const generationTime = Date.now() - startTime;
              console.log(`[${character.name}] Response status for variation ${i + 1} (attempt ${attempts}): ${aiResponse.status} (${generationTime}ms)`);

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                
                // Extract base64 image from response
                if (aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
                  const imageUrl = aiData.choices[0].message.images[0].image_url.url;
                  images.push({
                    url: imageUrl,
                    variation: i + 1
                  });
                  console.log(`[${character.name}] ✓ Successfully generated variation ${i + 1} on attempt ${attempts}`);
                  success = true;
                } else {
                  console.error(`[${character.name}] ✗ No image URL in response (attempt ${attempts})`);
                  if (attempts < maxAttempts) {
                    console.log(`[${character.name}] Retrying in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  }
                }
              } else {
                const errorData = await aiResponse.json();
                console.error(`[${character.name}] ✗ AI API error ${aiResponse.status} (attempt ${attempts}):`, errorData);
                if (attempts < maxAttempts) {
                  console.log(`[${character.name}] Retrying in 2 seconds...`);
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
            } catch (error) {
              console.error(`[${character.name}] ✗ Exception for variation ${i + 1} (attempt ${attempts}):`, error instanceof Error ? error.message : error);
              if (attempts < maxAttempts) {
                console.log(`[${character.name}] Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }

          if (!success) {
            console.error(`[${character.name}] ⚠️ FAILED to generate variation ${i + 1} after ${maxAttempts} attempts`);
          }
          
          // Small delay between successful generations
          if (success && i < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        console.log(`[${character.name}] Summary: ${images.length}/3 images generated`);
        
        if (images.length === 0) {
          console.error(`[${character.name}] ⚠️ WARNING: NO IMAGES GENERATED!`);
        }

        return {
          ...character,
          images
        };
      })
    );

    console.log('\n=== IMAGE GENERATION COMPLETE ===');
    console.log('Final summary:');
    charactersWithImages.forEach(char => {
      console.log(`  - ${char.name}: ${char.images.length}/3 images`);
    });
    
    const totalImages = charactersWithImages.reduce((sum, char) => sum + char.images.length, 0);
    const maxPossibleImages = charactersData.characters.length * 3;
    console.log(`Total: ${totalImages}/${maxPossibleImages} images generated`);

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
