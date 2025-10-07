import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Video, Check, X, EyeOff } from "lucide-react";

type Character = {
  name: string;
  description: string;
  role: string;
  images: Array<{ url: string; variation: number }>;
  status?: "approved" | "rejected" | "ignored";
};

type Step = "input" | "review" | "feedback" | "character-generation" | "character-review" | "character-feedback";

const VideoGeneration = () => {
  const [lyrics, setLyrics] = useState("");
  const [script, setScript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterFeedback, setCharacterFeedback] = useState("");
  const [selectedImages, setSelectedImages] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const { toast } = useToast();

  const handleGenerateScript = async (improvementFeedback?: string) => {
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
        body: { 
          lyrics,
          feedback: improvementFeedback,
          previousScript: improvementFeedback ? script : undefined
        },
      });

      if (error) throw error;

      setScript(data.script);
      setStep("review");
      setFeedback("");
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

  const handleApprove = async () => {
    setIsGenerating(true);
    setStep("character-generation");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-characters", {
        body: { script },
      });

      if (error) throw error;

      const charactersWithStatus = data.characters.map((char: Character) => ({
        ...char,
        status: "approved" as const
      }));
      setCharacters(charactersWithStatus);
      // Initialize selected images (default to first variation)
      const initialSelection: Record<string, number> = {};
      data.characters.forEach((char: Character) => {
        initialSelection[char.name] = 1;
      });
      setSelectedImages(initialSelection);
      
      setStep("character-review");
      toast({
        title: "Sucesso",
        description: "Personagens gerados com sucesso!",
      });
    } catch (error) {
      console.error("Error generating characters:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar personagens. Tente novamente.",
        variant: "destructive",
      });
      setStep("review");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = () => {
    setStep("feedback");
  };

  const handleImprove = () => {
    if (!feedback.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça instruções para melhorar o roteiro",
        variant: "destructive",
      });
      return;
    }
    handleGenerateScript(feedback);
  };

  const handleBack = () => {
    setStep("input");
    setScript("");
    setFeedback("");
    setCharacters([]);
    setCharacterFeedback("");
    setSelectedImages({});
  };

  const handleApproveCharacters = () => {
    const approvedCharacters = characters.filter(char => char.status === "approved");
    toast({
      title: "Personagens aprovados",
      description: `${approvedCharacters.length} personagens aprovados. Processando para geração de cenários...`,
    });
    // Future: Navigate to scenario generation
  };

  const handleCharacterStatusChange = (characterName: string, status: "approved" | "rejected" | "ignored") => {
    setCharacters(prev => 
      prev.map(char => 
        char.name === characterName ? { ...char, status } : char
      )
    );
  };

  const handleRejectCharacters = () => {
    const rejectedCharacters = characters.filter(char => char.status === "rejected");
    if (rejectedCharacters.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhum personagem foi rejeitado",
        variant: "destructive",
      });
      return;
    }
    setStep("character-feedback");
  };

  const handleImproveCharacters = async () => {
    if (!characterFeedback.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça instruções para melhorar os personagens",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-characters", {
        body: { 
          script,
          feedback: characterFeedback,
          previousCharacters: characters
        },
      });

      if (error) throw error;

      const charactersWithStatus = data.characters.map((char: Character) => ({
        ...char,
        status: "approved" as const
      }));
      setCharacters(charactersWithStatus);
      const initialSelection: Record<string, number> = {};
      data.characters.forEach((char: Character) => {
        initialSelection[char.name] = 1;
      });
      setSelectedImages(initialSelection);
      
      setStep("character-review");
      setCharacterFeedback("");
      toast({
        title: "Sucesso",
        description: "Personagens regenerados com sucesso!",
      });
    } catch (error) {
      console.error("Error regenerating characters:", error);
      toast({
        title: "Erro",
        description: "Falha ao regenerar personagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleImageSelection = (characterName: string, variation: number) => {
    setSelectedImages(prev => ({
      ...prev,
      [characterName]: variation
    }));
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

      {step === "input" && (
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
              onClick={() => handleGenerateScript()}
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
      )}

      {step === "review" && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Roteiro Gerado</Label>
              <div className="bg-muted rounded-lg p-4 min-h-[300px] whitespace-pre-wrap">
                {script}
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleReject} variant="outline" className="flex-1">
                Reprovar
              </Button>
              <Button onClick={handleApprove} className="flex-1">
                Aprovar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === "feedback" && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Roteiro Atual</Label>
              <div className="bg-muted rounded-lg p-4 max-h-[200px] overflow-y-auto whitespace-pre-wrap text-sm">
                {script}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Instruções para Melhorar o Roteiro</Label>
              <Textarea
                id="feedback"
                placeholder="Descreva o que gostaria de melhorar no roteiro..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                Voltar ao Início
              </Button>
              <Button 
                onClick={handleImprove} 
                disabled={isGenerating || !feedback.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Novo Roteiro...
                  </>
                ) : (
                  "Gerar Novo Roteiro"
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === "character-generation" && (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Gerando personagens...</p>
            <p className="text-sm text-muted-foreground">Isso pode levar alguns instantes</p>
          </div>
        </Card>
      )}

      {step === "character-review" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Personagens Gerados</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Para cada personagem: selecione a melhor imagem, rejeite ou ignore
            </p>
            
            <div className="space-y-8">
              {characters.map((character) => (
                <div key={character.name} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{character.name}</h3>
                      <p className="text-sm text-muted-foreground">{character.role}</p>
                      <p className="text-sm mt-1">{character.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant={character.status === "rejected" ? "destructive" : "outline"}
                        onClick={() => handleCharacterStatusChange(character.name, "rejected")}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant={character.status === "ignored" ? "secondary" : "outline"}
                        onClick={() => handleCharacterStatusChange(character.name, "ignored")}
                      >
                        <EyeOff className="h-4 w-4 mr-1" />
                        Ignorar
                      </Button>
                      {(character.status === "rejected" || character.status === "ignored") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCharacterStatusChange(character.name, "approved")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className={`grid grid-cols-3 gap-4 transition-opacity ${
                      character.status === "rejected" || character.status === "ignored" 
                        ? "opacity-50" 
                        : ""
                    }`}
                  >
                    {character.images.map((image) => (
                      <div
                        key={image.variation}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          character.status === "approved" && selectedImages[character.name] === image.variation
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => {
                          if (character.status === "approved") {
                            toggleImageSelection(character.name, image.variation);
                          }
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`${character.name} - Variação ${image.variation}`}
                          className="w-full h-48 object-cover"
                        />
                        {character.status === "approved" && selectedImages[character.name] === image.variation && (
                          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                          Variação {image.variation}
                        </div>
                      </div>
                    ))}
                  </div>

                  {character.status === "rejected" && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm text-destructive font-medium">
                        Este personagem será regenerado com base no seu feedback
                      </p>
                    </div>
                  )}
                  {character.status === "ignored" && (
                    <div className="bg-muted border border-border rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Este personagem não será usado nas cenas
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button 
              onClick={handleRejectCharacters} 
              variant="outline" 
              className="flex-1"
              disabled={!characters.some(char => char.status === "rejected")}
            >
              Regenerar Personagens Rejeitados
            </Button>
            <Button 
              onClick={handleApproveCharacters} 
              className="flex-1"
              disabled={characters.some(char => char.status === "rejected")}
            >
              Aprovar e Continuar ({characters.filter(c => c.status === "approved").length} personagens)
            </Button>
          </div>
        </div>
      )}

      {step === "character-feedback" && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Personagens Rejeitados</Label>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-h-[200px] overflow-y-auto text-sm space-y-2">
                {characters
                  .filter(char => char.status === "rejected")
                  .map((char) => (
                    <div key={char.name} className="flex items-start gap-2">
                      <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>{char.name}</strong> - {char.role}
                        <p className="text-xs text-muted-foreground mt-1">{char.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="characterFeedback">Instruções para Melhorar os Personagens Rejeitados</Label>
              <Textarea
                id="characterFeedback"
                placeholder="Descreva especificamente o que gostaria de melhorar nos personagens rejeitados..."
                value={characterFeedback}
                onChange={(e) => setCharacterFeedback(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                Voltar ao Início
              </Button>
              <Button 
                onClick={handleImproveCharacters} 
                disabled={isGenerating || !characterFeedback.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerando Personagens...
                  </>
                ) : (
                  "Regenerar Personagens Rejeitados"
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VideoGeneration;
