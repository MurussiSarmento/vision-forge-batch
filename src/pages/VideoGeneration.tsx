import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Video } from "lucide-react";

const VideoGeneration = () => {
  const [lyrics, setLyrics] = useState("");
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<"input" | "review">("input");
  const { toast } = useToast();

  const handleGenerateScript = async () => {
    if (!lyrics.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a letra da música",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-script", {
        body: { lyrics },
      });

      if (error) throw error;

      setScript(data.script);
      setStep("review");
      toast({
        title: "Sucesso",
        description: "Roteiro gerado com sucesso!",
      });
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar roteiro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    toast({
      title: "Roteiro aprovado",
      description: "O roteiro foi aprovado e será processado.",
    });
    // Future: Implement video generation logic here
  };

  const handleBack = () => {
    setStep("input");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Video className="h-8 w-8" />
          Gerar Vídeo Completo
        </h1>
        <p className="text-muted-foreground mt-2">
          Gere roteiros de vídeo a partir da letra da sua música
        </p>
      </div>

      {step === "input" ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lyrics">Letra da Música</Label>
              <Textarea
                id="lyrics"
                placeholder="Cole aqui a letra da sua música..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            </div>
            <Button
              onClick={handleGenerateScript}
              disabled={isGenerating || !lyrics.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Roteiro...
                </>
              ) : (
                "Prosseguir"
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Roteiro Gerado</Label>
              <div className="bg-muted rounded-lg p-4 min-h-[300px] whitespace-pre-wrap">
                {script}
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleApprove} className="flex-1">
                Aprovar Roteiro
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VideoGeneration;
