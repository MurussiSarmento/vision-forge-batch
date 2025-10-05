import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Zap, Pause, RotateCw, CheckCircle2 } from "lucide-react";

const Generation = () => {
  const progress = 45;
  const completed = 135;
  const total = 300;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generation Monitor</h1>
        <p className="mt-2 text-muted-foreground">
          Track your batch image generation in real-time
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Generating Images...
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {completed} of {total} images completed ({progress}%)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Pause className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Progress value={progress} className="h-3" />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="mt-2 text-2xl font-bold text-success">98.5%</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Avg. Time/Image</p>
              <p className="mt-2 text-2xl font-bold text-foreground">2.3s</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Est. Remaining</p>
              <p className="mt-2 text-2xl font-bold text-primary">4m 20s</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Active API Keys
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="flex items-center gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Zap className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  API Key #{key}
                </p>
                <p className="text-xs text-muted-foreground">
                  {45 + key * 3} requests • Active
                </p>
              </div>
              <div className="text-right">
                <Progress value={Math.random() * 100} className="h-2 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Recent Completions
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex items-center gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Prompt batch #{item}
                </p>
                <p className="text-xs text-muted-foreground">
                  3 variations generated • 2.1s avg
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Generation;
