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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Generating Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Generation;
