import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Zap, Clock, Chrome } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isPending = searchParams.get('pending') === 'true';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao autenticar com Google",
      });
      setLoading(false);
    }
  };

  const handleDummyLogin = async () => {
    setLoading(true);
    
    try {
      // Force complete session cleanup
      await supabase.auth.signOut();
      
      // Clear all local storage to ensure clean state
      localStorage.clear();
      sessionStorage.clear();
      
      // Wait a bit to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create unique test user with crypto-random identifier
      const randomBytes = new Uint8Array(16);
      crypto.getRandomValues(randomBytes);
      const uniqueId = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      const dummyEmail = `test-${uniqueId}@visionai.com`;
      const dummyPassword = `TestPass${uniqueId}!123`;

      console.log("🔐 Creating isolated test user:", dummyEmail);

      // Create new test user with auto-confirm enabled
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: dummyPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `Test User ${uniqueId.substring(0, 8)}`,
          },
        },
      });

      if (signUpError) {
        console.error("❌ SignUp error:", signUpError);
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("Failed to create test user");
      }

      console.log("✅ Test user created successfully:", {
        userId: signUpData.user.id,
        email: signUpData.user.email
      });

      toast({
        title: "Sessão de teste criada",
        description: `Usuário isolado criado: ${dummyEmail.substring(0, 20)}...`,
      });
      
      // Small delay to ensure session is established
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate("/");
    } catch (error: any) {
      console.error("❌ Test login error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar sessão de teste",
        description: error.message || "Ocorreu um erro durante a autenticação",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now sign in with your credentials.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred during authentication",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-surface/80 backdrop-blur-sm border border-border shadow-elegant">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-primary">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">VisionAI</h1>
          <p className="text-muted-foreground">
            {isPending 
              ? "Sua conta está sendo revisada" 
              : isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {isPending ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Aguardando Aprovação</AlertTitle>
            <AlertDescription>
              Sua conta foi criada com sucesso e está aguardando aprovação do administrador. 
              Você receberá uma notificação quando sua conta for aprovada.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground">Ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <Chrome className="mr-2 h-4 w-4" />
          Continuar com Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleDummyLogin}
          disabled={loading}
        >
          <Zap className="mr-2 h-4 w-4" />
          Login de Teste (Desenvolvimento)
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Auth;