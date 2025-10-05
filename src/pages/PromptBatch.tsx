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
import { Loader2 } from "lucide-react";

const PromptBatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompts, setPrompts] = useState("");
  const [variationsCount, setVariationsCount] = useState(3);
  const [generating, setGenerating] = useState(false);

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
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("generate-images", {
        body: { 
          prompts: promptsArray,
          variationsCount 
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
          <CardTitle>Prompt Batch</CardTitle>
          <CardDescription>
            Enter your prompts (one per line) and specify how many variations you want for each
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompts">Prompts</Label>
            <Textarea
              id="prompts"
              placeholder="A beautiful sunset over mountains&#10;A futuristic city at night&#10;An underwater coral reef"
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              rows={10}
              disabled={generating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variations">Variations per Prompt</Label>
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

          <Button onClick={startGeneration} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Generation...
              </>
            ) : (
              "Generate Images"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptBatch;
