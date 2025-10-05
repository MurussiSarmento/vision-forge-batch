import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PromptBatch = () => {
  const [prompts, setPrompts] = useState("");
  const [format, setFormat] = useState<"text" | "json">("text");
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPrompts(event.target?.result as string);
        toast({
          title: "File Uploaded",
          description: `Loaded ${file.name} successfully`,
        });
      };
      reader.readAsText(file);
    }
  };

  const promptCount = prompts.split("\n").filter((p) => p.trim()).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Batch Prompts</h1>
        <p className="mt-2 text-muted-foreground">
          Upload up to 1,000 prompts for mass image generation
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompts" className="text-base font-semibold">
                  Prompts
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={format === "text" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormat("text")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Text
                  </Button>
                  <Button
                    variant={format === "json" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormat("json")}
                  >
                    JSON
                  </Button>
                </div>
              </div>

              <Textarea
                id="prompts"
                value={prompts}
                onChange={(e) => setPrompts(e.target.value)}
                placeholder={
                  format === "text"
                    ? "A serene mountain landscape at sunset\nA futuristic city with flying cars\nA cozy coffee shop interior"
                    : '[\n  {"prompt": "A serene mountain landscape", "style": "photorealistic"},\n  {"prompt": "A futuristic city", "style": "cyberpunk"}\n]'
                }
                className="min-h-[400px] font-mono text-sm"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".txt,.json"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {promptCount} prompts
                  </span>
                </div>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Generation
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Reference Image
            </h3>
            <div className="space-y-4">
              <div className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary">
                <div className="text-center">
                  <Image className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drop image here
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload Reference
              </Button>
              <p className="text-xs text-muted-foreground">
                Global reference image applied to all prompts
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Generation Settings
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variations per prompt:</span>
                <span className="font-medium text-foreground">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total images:</span>
                <span className="font-medium text-foreground">
                  {promptCount * 3}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. time:</span>
                <span className="font-medium text-foreground">
                  ~{Math.ceil((promptCount * 3) / 10)} min
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PromptBatch;
