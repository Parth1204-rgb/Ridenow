import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUpdateUser, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { User, Mail, Phone, Shield, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = useGetMe();
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(""); setSuccess("");
    try {
      const updated = await updateUser.mutateAsync({ id: user.id, data: { name: form.name, phone: form.phone || null } });
      login(token!, { ...user, ...updated } as typeof user);
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setSuccess("Profile updated successfully");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string }; message?: string };
      setError(e?.data?.error ?? e?.message ?? "Failed to update profile");
    }
  };

  const displayUser = profile ?? user;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account details</p>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
          {(displayUser?.name ?? "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{displayUser?.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">
              <Shield size={11} />
              {displayUser?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-5">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={displayUser?.email ?? ""}
                disabled
                className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3.5 py-2.5">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={updateUser.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Save size={15} />
            {updateUser.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
