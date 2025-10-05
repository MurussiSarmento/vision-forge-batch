import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ValidationResult {
  key: string;
  valid: boolean;
  message: string;
}

const ApiSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState("");
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);

  const validateKeys = async () => {
    if (!apiKeys.trim()) {
      toast.error("Please enter at least one API key");
      return;
    }

    const keysArray = apiKeys
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keysArray.length === 0) {
      toast.error("Please enter valid API keys");
      return;
    }

    setValidating(true);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("validate-api-keys", {
        body: { apiKeys: keysArray },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      setResults(response.data.results);
      
      const validCount = response.data.results.filter((r: ValidationResult) => r.valid).length;
      
      if (validCount > 0) {
        toast.success(`${validCount} API key(s) validated successfully`);
      } else {
        toast.error("No valid API keys found");
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate API keys");
    } finally {
      setValidating(false);
    }
  };

  const continueToNextStep = () => {
    if (results.some((r) => r.valid)) {
      navigate("/prompt-batch");
    } else {
      toast.error("Please add at least one valid API key");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de API Keys</CardTitle>
          <CardDescription>
            Digite suas chaves de API do Google AI Studio (uma por linha) para começar.
            Obtenha sua chave gratuita em: https://aistudio.google.com/app/apikey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Cole suas chaves de API aqui (uma por linha)"
            value={apiKeys}
            onChange={(e) => setApiKeys(e.target.value)}
            rows={10}
            disabled={validating}
          />
          <Button onClick={validateKeys} disabled={validating} className="w-full">
            {validating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              "Validar Chaves de API"
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex items-center gap-2">
                    {result.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <code className="text-sm">{result.key}</code>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
            {results.some((r) => r.valid) && (
              <Button onClick={continueToNextStep} className="w-full mt-4">
                Continuar para Lote de Prompts
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiSetup;
