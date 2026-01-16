import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Copy, RefreshCw, Check, Settings2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PasswordGenerator = () => {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = "";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset === "") {
      toast.error("Please select at least one character type");
      return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    
    setPassword(result);
    setCopied(false);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const copyToClipboard = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    let strength = 0;
    if (length >= 12) strength++;
    if (length >= 16) strength++;
    if (includeUppercase && includeLowercase) strength++;
    if (includeNumbers) strength++;
    if (includeSymbols) strength++;
    return strength;
  };

  const strength = getStrength();
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Password Generator"
          description="Generate secure, random passwords with customizable options"
          icon={Lock}
          color="--tool-password"
        />

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Password Display */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={password}
                    readOnly
                    placeholder="Click generate to create password"
                    className="w-full input-dark font-mono text-lg pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={copyToClipboard}
                      disabled={!password}
                      className="p-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                      title="Copy"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={generatePassword}
                      className="p-2 rounded-lg hover:bg-secondary/80 transition-colors"
                      title="Generate"
                    >
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Strength Indicator */}
              {password && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= strength ? strengthColors[strength] : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings2 className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-medium">Password Settings</h3>
              </div>

              {/* Length Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Length</label>
                  <span className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                    {length}
                  </span>
                </div>
                <Slider
                  value={[length]}
                  onValueChange={(value) => setLength(value[0])}
                  min={4}
                  max={64}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Character Options */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 cursor-pointer">
                  <span className="text-sm">Uppercase (A-Z)</span>
                  <Switch checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 cursor-pointer">
                  <span className="text-sm">Lowercase (a-z)</span>
                  <Switch checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 cursor-pointer">
                  <span className="text-sm">Numbers (0-9)</span>
                  <Switch checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 cursor-pointer">
                  <span className="text-sm">Symbols (!@#$)</span>
                  <Switch checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePassword}
                className="w-full btn-primary-gradient flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Generate Password
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PasswordGenerator;
