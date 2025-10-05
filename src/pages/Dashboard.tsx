import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Key, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { label: "Total Generations", value: "1,234", change: "+12.5%", trend: "up" },
    { label: "Active API Keys", value: "3", change: "+1", trend: "up" },
    { label: "Success Rate", value: "98.2%", change: "+0.5%", trend: "up" },
    { label: "Avg. Gen Time", value: "2.4s", change: "-0.3s", trend: "down" },
  ];

  const quickActions = [
    {
      title: "Setup API Keys",
      description: "Add and validate your Google Vision API keys",
      icon: Key,
      href: "/api-setup",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Create Batch",
      description: "Upload prompts and start generating images",
      icon: FileText,
      href: "/prompt-batch",
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Quick Generate",
      description: "Generate images with existing configuration",
      icon: Zap,
      href: "/generation",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here's your image generation overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="p-6 transition-all hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === "up" ? "text-success" : "text-primary"
                }`}
              >
                {stat.change}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="group relative overflow-hidden p-6 transition-all hover:shadow-lg hover:shadow-primary/20">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-10`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg bg-gradient-to-br ${action.color} p-3 shadow-lg`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Generated 150 images
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
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

export default Dashboard;
