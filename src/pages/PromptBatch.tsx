import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const PromptBatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompts, setPrompts] = useState("");
  const [variationsCount, setVariationsCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setReferenceImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
  };

  const uploadReferenceImage = async (): Promise<string | null> => {
    if (!referenceImage || !user) return null;

    setUploadingImage(true);
    try {
      const fileExt = referenceImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('generated-images')
        .upload(fileName, referenceImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generated-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload reference image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const startGeneration = async () => {
    if (!prompts.trim()) {
      toast.error("Please enter at least one prompt");
      return;
    }

    const promptsArray = prompts
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (promptsArray.length === 0) {
      toast.error("Please enter valid prompts");
      return;
    }

    if (variationsCount < 1 || variationsCount > 10) {
      toast.error("Variations count must be between 1 and 10");
      return;
    }

    setGenerating(true);

    try {
      // Upload reference image if provided
      let referenceImageUrl = null;
      if (referenceImage) {
        referenceImageUrl = await uploadReferenceImage();
        if (!referenceImageUrl) {
          setGenerating(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("generate-images", {
        body: { 
          prompts: promptsArray,
          variationsCount,
          referenceImageUrl 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast.success("Generation started!");
      navigate(`/generation?sessionId=${response.data.sessionId}`);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to start generation");
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Lote de Prompts</CardTitle>
          <CardDescription>
            Digite seus prompts (um por linha) e especifique quantas variações você quer para cada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference">Imagem de Referência (Opcional)</Label>
            {referenceImagePreview ? (
              <div className="relative">
                <img 
                  src={referenceImagePreview} 
                  alt="Reference" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeReferenceImage}
                  disabled={generating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="reference-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique para fazer upload de uma imagem de referência
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG ou WEBP (max 5MB)
                  </p>
                </div>
                <Input
                  id="reference-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={generating}
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompts">Prompts</Label>
            <Textarea
              id="prompts"
              placeholder="Um pôr do sol lindo sobre as montanhas&#10;Uma cidade futurista à noite&#10;Um recife de coral submarino"
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              rows={10}
              disabled={generating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variations">Variações por Prompt</Label>
            <Input
              id="variations"
              type="number"
              min={1}
              max={10}
              value={variationsCount}
              onChange={(e) => setVariationsCount(parseInt(e.target.value))}
              disabled={generating}
            />
          </div>

          <Button 
            onClick={startGeneration} 
            disabled={generating || uploadingImage} 
            className="w-full"
          >
            {generating || uploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingImage ? "Enviando imagem..." : "Iniciando geração..."}
              </>
            ) : (
              "Gerar Imagens"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptBatch;
