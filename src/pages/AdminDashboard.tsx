import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, LogOut, Save, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import AdAnalytics from "@/components/ads/AdAnalytics";

interface AdPlacement {
  id: string;
  slot_name: string;
  html_content: string;
  is_active: boolean;
  placement: string;
  position: string;
}

const slotLabels: Record<string, string> = {
  header_banner: "Header Banner (below navigation)",
  between_tools: "Between Tool Cards (homepage grid)",
  footer_banner: "Footer Banner (above footer)",
};

const placementOptions = [
  { value: "all_pages", label: "All Pages" },
  { value: "homepage", label: "Homepage Only" },
  { value: "tool_pages", label: "Tool Pages Only" },
  { value: "/pdf-tools", label: "PDF Tools" },
  { value: "/password", label: "Password Generator" },
  { value: "/compress", label: "Image Compressor" },
  { value: "/convert", label: "Image Converter" },
  { value: "/weather", label: "Weather" },
  { value: "/resume", label: "Resume Builder" },
  { value: "/audio", label: "Audio Extractor" },
  { value: "/ai-chat", label: "AI Chat" },
  { value: "/video-compress", label: "Video Compressor" },
  { value: "/qr-code", label: "QR Code Generator" },
  { value: "/text-to-speech", label: "Text to Speech" },
  { value: "/speech-to-text", label: "Speech to Text" },
  { value: "/markdown", label: "Markdown Editor" },
  { value: "/json", label: "JSON Formatter" },
  { value: "/podcast", label: "Podcast Avatar" },
];

const positionOptions = [
  { value: "header", label: "Top of Page (below nav)" },
  { value: "after_content", label: "After Main Content" },
  { value: "between_tools", label: "Between Tool Cards" },
  { value: "sidebar", label: "Sidebar Area" },
  { value: "footer", label: "Footer Area" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Record<string, boolean>>({});
  const [newSlotName, setNewSlotName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin-login");
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast.error("Access denied. You are not an admin.");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      await fetchAds();
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from("ad_placements")
      .select("*")
      .order("slot_name");
    if (error) {
      toast.error("Failed to load ads");
      return;
    }
    setAds(data || []);
  };

  const handleSave = async (ad: AdPlacement) => {
    setSaving(ad.id);
    const { error } = await supabase
      .from("ad_placements")
      .update({
        html_content: ad.html_content,
        is_active: ad.is_active,
        placement: ad.placement,
        position: ad.position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ad.id);
    setSaving(null);
    if (error) {
      toast.error(`Failed to save: ${error.message}`);
    } else {
      toast.success("Ad placement saved!");
    }
  };

  const handleCreate = async () => {
    const slug = newSlotName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    if (!slug) {
      toast.error("Please enter a valid slot name");
      return;
    }
    if (ads.some((a) => a.slot_name === slug)) {
      toast.error("A slot with that name already exists");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("ad_placements")
      .insert({ slot_name: slug })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error(`Failed to create: ${error.message}`);
    } else if (data) {
      setAds((prev) => [...prev, data]);
      setNewSlotName("");
      toast.success(`Slot "${slug}" created!`);
    }
  };

  const handleDelete = async (ad: AdPlacement) => {
    if (!confirm(`Delete slot "${ad.slot_name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("ad_placements").delete().eq("id", ad.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
    } else {
      setAds((prev) => prev.filter((a) => a.id !== ad.id));
      toast.success("Slot deleted");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const updateAd = (id: string, updates: Partial<AdPlacement>) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const togglePreview = (id: string) => {
    setPreviewing((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          Checking permissions...
        </div>
      </Layout>
    );
  }

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Ad Management</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>

        {/* Create new slot */}
        <div className="glass-card p-4 mb-6 flex items-center gap-3">
          <Input
            value={newSlotName}
            onChange={(e) => setNewSlotName(e.target.value)}
            placeholder="New slot name (e.g. sidebar_ad)"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button size="sm" onClick={handleCreate} disabled={creating || !newSlotName.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            {creating ? "Creating..." : "Add Slot"}
          </Button>
        </div>

        <AdAnalytics />

        <div className="space-y-6">
          {ads.map((ad) => (
            <div key={ad.id} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {slotLabels[ad.slot_name] || ad.slot_name}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {ad.is_active ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={(checked) => updateAd(ad.id, { is_active: checked })}
                    />
                  </div>
                  {!slotLabels[ad.slot_name] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(ad)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Placement & Position selectors for custom slots */}
              {!slotLabels[ad.slot_name] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Show On
                    </label>
                    <Select
                      value={ad.placement || "all_pages"}
                      onValueChange={(val) => updateAd(ad.id, { placement: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {placementOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Position
                    </label>
                    <Select
                      value={ad.position || "after_content"}
                      onValueChange={(val) => updateAd(ad.id, { position: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positionOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Textarea
                value={ad.html_content}
                onChange={(e) => updateAd(ad.id, { html_content: e.target.value })}
                placeholder="Paste your ad HTML code here..."
                className="font-mono text-xs min-h-[120px]"
              />
              <div className="flex items-center gap-2">
                <Button onClick={() => handleSave(ad)} disabled={saving === ad.id} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  {saving === ad.id ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePreview(ad.id)}
                  disabled={!ad.html_content.trim()}
                >
                  {previewing[ad.id] ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" /> Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" /> Preview
                    </>
                  )}
                </Button>
              </div>
              {previewing[ad.id] && ad.html_content.trim() && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Live Preview</p>
                  <div
                    className="ad-preview-render"
                    dangerouslySetInnerHTML={{ __html: ad.html_content }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
