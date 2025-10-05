import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const Settings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Configure your generation preferences and account settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Generation Settings
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Images per Prompt</Label>
              <Slider defaultValue={[3]} min={1} max={5} step={1} />
              <p className="text-xs text-muted-foreground">
                Number of variations to generate (1-5)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Default Quality</Label>
              <Slider defaultValue={[80]} min={50} max={100} step={10} />
              <p className="text-xs text-muted-foreground">
                Image quality percentage (50-100)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-start Generation</Label>
                <p className="text-xs text-muted-foreground">
                  Begin immediately after uploading prompts
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when generation completes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Account Settings
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable dark theme
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save Results</Label>
                <p className="text-xs text-muted-foreground">
                  Save all generated images automatically
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Usage Analytics</Label>
                <p className="text-xs text-muted-foreground">
                  Help improve our service
                </p>
              </div>
              <Switch />
            </div>

            <div className="pt-4 border-t border-border">
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Advanced Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Rate Limiting</Label>
              <p className="text-xs text-muted-foreground">
                Automatically distribute requests across API keys
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Cache Generated Images</Label>
              <p className="text-xs text-muted-foreground">
                Store images locally for faster access
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button className="bg-gradient-primary hover:opacity-90">
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Settings;
