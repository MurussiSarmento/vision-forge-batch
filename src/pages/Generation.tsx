import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const Generation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("Initializing...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("sessionId");
    
    if (!id) {
      toast.error("No generation session found");
      navigate("/prompt-batch");
      return;
    }

    setSessionId(id);
    
    // Fetch initial session state
    const fetchInitialState = async () => {
      const { data: session, error } = await supabase
        .from('generation_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        toast.error("Failed to load generation session");
        navigate("/prompt-batch");
        return;
      }

      if (session) {
        const percentage = session.total_prompts > 0 
          ? Math.round((session.completed_prompts / session.total_prompts) * 100)
          : 0;
        setProgress(percentage);
        setStatus(`Processing: ${session.completed_prompts}/${session.total_prompts} prompts completed`);

        if (session.status === 'completed') {
          toast.success("Generation completed!");
          setTimeout(() => {
            navigate(`/results?sessionId=${id}`);
          }, 1000);
        }
      }
    };

    fetchInitialState();
    monitorSession(id);
  }, [navigate]);

  const monitorSession = async (id: string) => {
    const channel = supabase
      .channel(`session-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_sessions',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const session = payload.new as any;
          if (session) {
            const percentage = Math.round(
              (session.completed_prompts / session.total_prompts) * 100
            );
            setProgress(percentage);
            setStatus(`Processing: ${session.completed_prompts}/${session.total_prompts} prompts completed`);

            if (session.status === 'completed') {
              toast.success("Generation completed!");
              setTimeout(() => {
                navigate(`/results?sessionId=${id}`);
              }, 1000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Gerando Imagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm text-muted-foreground">{status}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Processando suas imagens...
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Aguarde enquanto geramos suas imagens. Você será redirecionado automaticamente quando concluir.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Generation;
