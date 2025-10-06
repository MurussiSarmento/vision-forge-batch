import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Copy, Check } from "lucide-react";

const CreateUsers = () => {
  const [loading, setLoading] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<Array<{
    email: string;
    password: string;
    success: boolean;
  }>>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const users = [
    {
      email: "fabio@visionai.com",
      password: "Fabio@2025!Secure",
      full_name: "Fábio",
    },
    {
      email: "nelson@visionai.com",
      password: "Nelson@2025!Secure",
      full_name: "Nelson",
    },
    {
      email: "lucas@visionai.com",
      password: "Lucas@2025!Secure",
      full_name: "Lucas",
    },
  ];

  const handleCreateUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-users", {
        body: { users },
      });

      if (error) throw error;

      const results = users.map((user, index) => ({
        email: user.email,
        password: user.password,
        success: data.results[index]?.success || false,
      }));

      setCreatedUsers(results);

      const successCount = results.filter((r) => r.success).length;
      toast({
        title: "Usuários criados",
        description: `${successCount} de ${users.length} usuários criados com sucesso`,
      });
    } catch (error: any) {
      console.error("Error creating users:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar usuários",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Criar Usuários</h1>
          <p className="text-muted-foreground">
            Crie os 3 usuários: Fábio, Nelson e Lucas
          </p>
        </div>

        {createdUsers.length === 0 ? (
          <Button
            onClick={handleCreateUsers}
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando usuários...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Criar 3 Usuários
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Credenciais de Acesso</h2>
            {createdUsers.map((user, index) => (
              <Card
                key={index}
                className={`p-4 ${
                  user.success
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-red-500/50 bg-red-500/5"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {user.email.split("@")[0]}
                    </span>
                    {user.success && (
                      <span className="text-xs text-green-500">✓ Criado</span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded">
                          {user.email}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(user.email, index * 2)}
                        >
                          {copiedIndex === index * 2 ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Senha:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded">
                          {user.password}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(user.password, index * 2 + 1)
                          }
                        >
                          {copiedIndex === index * 2 + 1 ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <Button
              onClick={() => setCreatedUsers([])}
              variant="outline"
              className="w-full"
            >
              Criar Novos Usuários
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CreateUsers;
