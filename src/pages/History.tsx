import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Images, CheckCircle2, RotateCw } from "lucide-react";

const History = () => {
  const sessions = [
    {
      id: 1,
      date: "2025-01-15",
      time: "14:30",
      prompts: 150,
      images: 450,
      status: "completed",
      duration: "8m 45s",
    },
    {
      id: 2,
      date: "2025-01-14",
      time: "09:15",
      prompts: 200,
      images: 600,
      status: "completed",
      duration: "11m 20s",
    },
    {
      id: 3,
      date: "2025-01-13",
      time: "16:45",
      prompts: 75,
      images: 225,
      status: "completed",
      duration: "4m 15s",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generation History</h1>
        <p className="mt-2 text-muted-foreground">
          View and reload previous generation sessions
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className="p-6 transition-all hover:shadow-lg hover:shadow-primary/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                  <Images className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Session #{session.id}
                    </h3>
                    <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {session.date} at {session.time}
                    </span>
                    <span>Duration: {session.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Prompts</p>
                  <p className="text-2xl font-bold text-foreground">{session.prompts}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Images</p>
                  <p className="text-2xl font-bold text-primary">{session.images}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">View Results</Button>
                  <Button variant="outline" size="icon">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;
