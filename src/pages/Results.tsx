import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download } from "lucide-react";

interface Result {
  id: string;
  image_url: string;
  variation_number: number;
  is_selected: boolean;
  batch_id: string;
}

const Results = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("sessionId");
    
    if (!id) {
      toast.error("No session found");
      navigate("/prompt-batch");
      return;
    }

    setSessionId(id);
    loadResults(id);
  }, [navigate]);

  const loadResults = async (id: string) => {
    try {
      const { data: batches } = await supabase
        .from("prompt_batches")
        .select("id")
        .eq("session_id", id);

      if (!batches || batches.length === 0) {
        setLoading(false);
        return;
      }

      const batchIds = batches.map((b) => b.id);

      const { data, error } = await supabase
        .from("generation_results")
        .select("*")
        .in("batch_id", batchIds)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Error loading results:", error);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("generation_results")
        .update({ is_selected: !currentValue })
        .eq("id", id);

      if (error) throw error;

      setResults(
        results.map((r) =>
          r.id === id ? { ...r, is_selected: !currentValue } : r
        )
      );
    } catch (error) {
      console.error("Error updating selection:", error);
      toast.error("Failed to update selection");
    }
  };

  const downloadSelected = () => {
    const selected = results.filter((r) => r.is_selected);
    if (selected.length === 0) {
      toast.error("No images selected");
      return;
    }

    selected.forEach((result) => {
      const link = document.createElement("a");
      link.href = result.image_url;
      link.download = `image-${result.id}.jpg`;
      link.click();
    });

    toast.success(`Downloading ${selected.length} images`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Loading results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Generated Images</CardTitle>
          <Button onClick={downloadSelected} disabled={!results.some((r) => r.is_selected)}>
            <Download className="mr-2 h-4 w-4" />
            Download Selected
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="relative">
                    <img
                      src={result.image_url}
                      alt={`Variation ${result.variation_number}`}
                      className="w-full h-48 object-cover rounded"
                    />
                    <div className="absolute top-2 right-2">
                      <Checkbox
                        checked={result.is_selected}
                        onCheckedChange={() =>
                          toggleSelection(result.id, result.is_selected)
                        }
                        className="bg-white"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Variation {result.variation_number}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
