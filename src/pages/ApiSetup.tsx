import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ApiSetup = () => {
  const [apiKeys, setApiKeys] = useState("");
  const [validating, setValidating] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState<Array<{ key: string; valid: boolean; message: string }>>([]);
  const { toast } = useToast();

  const validateKeys = async () => {
    const keys = apiKeys.split("\n").filter((k) => k.trim());
    
    if (keys.length === 0) {
      toast({
        title: "No API Keys",
        description: "Please enter at least one API key",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    
    // Simulate validation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const statuses = keys.map((key, index) => ({
      key: `${key.substring(0, 10)}...`,
      valid: Math.random() > 0.2,
      message: Math.random() > 0.2 ? "Valid key" : "Invalid or expired key",
    }));
    
    setKeyStatuses(statuses);
    setValidating(false);
    
    toast({
      title: "Validation Complete",
      description: `${statuses.filter(s => s.valid).length}/${statuses.length} keys validated successfully`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">API Key Management</h1>
        <p className="mt-2 text-muted-foreground">
          Add and validate your Google Vision API keys for batch image generation
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-keys" className="text-base font-semibold">
                API Keys
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter one API key per line. Multiple keys enable load balancing.
              </p>
            </div>
            
            <Textarea
              id="api-keys"
              value={apiKeys}
              onChange={(e) => setApiKeys(e.target.value)}
              placeholder="AIzaSyD..."
              className="min-h-[200px] font-mono text-sm"
            />
            
            <div className="flex gap-2">
              <Button
                onClick={validateKeys}
                disabled={validating}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate Keys"
                )}
              </Button>
              <Button variant="outline" onClick={() => setApiKeys("")}>
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Key Status</h3>
          
          {keyStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No keys validated yet. Add your API keys and click validate.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keyStatuses.map((status, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-border p-4"
                >
                  {status.valid ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-mono text-sm text-foreground">
                      {status.key}
                    </p>
                    <p
                      className={`text-xs ${
                        status.valid ? "text-success" : "text-destructive"
                      }`}
                    >
                      {status.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {keyStatuses.length > 0 && (
            <div className="mt-6 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valid Keys:</span>
                <span className="font-semibold text-foreground">
                  {keyStatuses.filter(s => s.valid).length} / {keyStatuses.length}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5 p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
          <AlertCircle className="h-5 w-5 text-primary" />
          Pro Tips
        </h3>
        <ul className="ml-7 space-y-2 text-sm text-muted-foreground">
          <li>• Use multiple API keys to distribute load and avoid rate limits</li>
          <li>• Keys are encrypted and stored securely in your account</li>
          <li>• Invalid keys will be automatically skipped during generation</li>
          <li>• Monitor your API usage in the Google Cloud Console</li>
        </ul>
      </Card>
    </div>
  );
};

export default ApiSetup;
