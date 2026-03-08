import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, LogOut, Save } from "lucide-react";

interface AdPlacement {
  id: string;
  slot_name: string;
  html_content: string;
  is_active: boolean;
}

const slotLabels: Record<string, string> = {
  header_banner: "Header Banner (below navigation)",
  between_tools: "Between Tool Cards (homepage grid)",
  footer_banner: "Footer Banner (above footer)",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
    // Admins need to see all ads including inactive ones
    // We'll use a direct query - RLS only allows active for anon
    // But admin is authenticated and has the role
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const updateAd = (id: string, updates: Partial<AdPlacement>) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
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

        <div className="space-y-6">
          {ads.map((ad) => (
            <div key={ad.id} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {slotLabels[ad.slot_name] || ad.slot_name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {ad.is_active ? "Active" : "Inactive"}
                  </span>
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={(checked) =>
                      updateAd(ad.id, { is_active: checked })
                    }
                  />
                </div>
              </div>
              <Textarea
                value={ad.html_content}
                onChange={(e) =>
                  updateAd(ad.id, { html_content: e.target.value })
                }
                placeholder="Paste your ad HTML code here..."
                className="font-mono text-xs min-h-[120px]"
              />
              <Button
                onClick={() => handleSave(ad)}
                disabled={saving === ad.id}
                size="sm"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving === ad.id ? "Saving..." : "Save"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
