import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, feedback, previousScript } = await req.json();

    if (!lyrics) {
      throw new Error('Lyrics are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
            content: 'Você é um especialista em roteiros para vídeos musicais. Crie roteiros detalhados e visuais com base nas letras de músicas fornecidas. O roteiro deve incluir cenas, transições, e descrições visuais que complementem a narrativa da música.'
          },
          {
            role: 'user',
            content: feedback && previousScript 
              ? `Aqui está o roteiro anterior:\n\n${previousScript}\n\nO cliente pediu as seguintes melhorias:\n${feedback}\n\nPor favor, reescreva o roteiro completo incorporando essas melhorias para a letra:\n\n${lyrics}\n\nO roteiro deve incluir:\n- Introdução visual\n- Cenas principais sincronizadas com as partes da música\n- Transições entre cenas\n- Elementos visuais e estéticos\n- Conclusão impactante`
              : `Crie um roteiro de vídeo completo e detalhado para a seguinte letra de música:\n\n${lyrics}\n\nO roteiro deve incluir:\n- Introdução visual\n- Cenas principais sincronizadas com as partes da música\n- Transições entre cenas\n- Elementos visuais e estéticos\n- Conclusão impactante`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI gateway error:', errorData);
      throw new Error('Failed to generate script');
    }

    const data = await response.json();
    const script = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ script }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-video-script function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
