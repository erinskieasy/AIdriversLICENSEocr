import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Info } from "lucide-react";
import { ConfigState } from "@/lib/types";

interface ConfigurationSectionProps {
  config: ConfigState;
  onConfigChange: (key: keyof ConfigState, value: string) => void;
}

export default function ConfigurationSection({
  config,
  onConfigChange,
}: ConfigurationSectionProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const isConfigured = Boolean(config.apiKey && config.assistantId);

  return (
    <section className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium mb-4">Configuration</h2>

          {/* API Key Input Group */}
          <div className="mb-4">
            <Label htmlFor="apiKey" className="block text-sm font-medium mb-1">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                id="apiKey"
                value={config.apiKey}
                onChange={(e) => onConfigChange("apiKey", e.target.value)}
                className="pr-10"
                placeholder="sk-..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={toggleApiKeyVisibility}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your API key will be used only for requests and not stored.
            </p>
          </div>

          {/* Assistant ID Input */}
          <div className="mb-4">
            <Label htmlFor="assistantId" className="block text-sm font-medium mb-1">
              Assistant ID
            </Label>
            <Input
              type="text"
              id="assistantId"
              value={config.assistantId}
              onChange={(e) => onConfigChange("assistantId", e.target.value)}
              placeholder="asst_..."
            />
            <p className="mt-1 text-xs text-gray-500">
              The ID of your OpenAI Assistant that can process images.
            </p>
          </div>

          {/* Configuration Status */}
          <div className="p-3 bg-gray-50 rounded-md mt-4 flex items-center">
            {!isConfigured ? (
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm">
                  Enter your API Key and Assistant ID to get started
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Configuration complete</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
