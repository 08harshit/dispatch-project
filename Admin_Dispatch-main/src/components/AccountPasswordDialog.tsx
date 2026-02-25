import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Copy,
  KeyRound,
  Clock,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

interface AccountPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  accountId: string;
  accountEmail: string;
}

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export function AccountPasswordDialog({
  open,
  onOpenChange,
  accountName,
  accountId,
  accountEmail,
}: AccountPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forceLogout, setForceLogout] = useState(true);

  const getStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (/[A-Z]/.test(pw)) score += 25;
    if (/[0-9]/.test(pw)) score += 25;
    if (/[^A-Za-z0-9]/.test(pw)) score += 25;
    if (score <= 25) return { score, label: "Faible", color: "bg-destructive" };
    if (score <= 50) return { score, label: "Moyen", color: "bg-warning" };
    if (score <= 75) return { score, label: "Bon", color: "bg-primary" };
    return { score, label: "Excellent", color: "bg-success" };
  };

  const strength = getStrength(newPassword);
  const match = newPassword && confirmPassword && newPassword === confirmPassword;
  const mismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  const handleGenerate = () => {
    const pw = generatePassword();
    setNewPassword(pw);
    setConfirmPassword(pw);
    setShowNew(true);
    setShowConfirm(true);
    toast.info("Mot de passe généré ! Copiez-le avant de sauvegarder.");
  };

  const handleCopy = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      toast.success("Mot de passe copié !");
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (strength.score < 50) {
      toast.error("Le mot de passe est trop faible");
      return;
    }

    setIsSaving(true);
    try {
      const { setCourierPassword } = await import("@/services/courierService");
      await setCourierPassword(accountId, newPassword);
      toast.success(`Mot de passe de ${accountName} modifié avec succès !`);
      setNewPassword("");
      setConfirmPassword("");
      setShowNew(false);
      setShowConfirm(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to update password:", err);
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNew(false);
    setShowConfirm(false);
  };

  // Mock data
  const lastChanged = "Il y a 32 jours";
  const sessions = 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            Gestion du mot de passe
          </DialogTitle>
          <DialogDescription>
            Modifier le mot de passe pour {accountName} ({accountId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Account Info Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">
                {accountName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{accountName}</p>
                <p className="text-xs text-muted-foreground">{accountEmail}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Actif
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="group flex items-center gap-3 p-3 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-all duration-300">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Dernière modif.</p>
                <p className="text-sm font-semibold text-foreground">{lastChanged}</p>
              </div>
            </div>
            <div className="group flex items-center gap-3 p-3 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-all duration-300">
              <div className="p-2 rounded-lg bg-primary/10">
                <Monitor className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessions actives</p>
                <p className="text-sm font-semibold text-foreground">{sessions} appareils</p>
              </div>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-4 p-4 rounded-2xl border bg-gradient-to-br from-muted/20 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground text-sm">Nouveau mot de passe</h4>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleGenerate} className="text-xs gap-1 h-7">
                  <RefreshCw className="h-3 w-3" />
                  Générer
                </Button>
                {newPassword && (
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="text-xs gap-1 h-7">
                    <Copy className="h-3 w-3" />
                    Copier
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mot de passe</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-background/50 border-muted-foreground/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              {newPassword && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Force</span>
                    <span className={`text-xs font-semibold ${strength.score <= 25 ? 'text-destructive' :
                      strength.score <= 50 ? 'text-warning' :
                        strength.score <= 75 ? 'text-primary' : 'text-success'
                      }`}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "8+ caractères", met: newPassword.length >= 8 },
                      { label: "Majuscule", met: /[A-Z]/.test(newPassword) },
                      { label: "Chiffre", met: /[0-9]/.test(newPassword) },
                      { label: "Spécial", met: /[^A-Za-z0-9]/.test(newPassword) },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${req.met ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                        <span className={`text-[11px] ${req.met ? 'text-foreground' : 'text-muted-foreground'}`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Confirmer</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 bg-background/50 border-muted-foreground/20 focus:border-primary ${match ? 'border-success/50' : mismatch ? 'border-destructive/50' : ''
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {match && (
                <p className="text-xs text-success flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="h-3 w-3" /> Mots de passe identiques
                </p>
              )}
              {mismatch && (
                <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
                  <ShieldAlert className="h-3 w-3" /> Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          </div>

          {/* Force Logout Toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 cursor-pointer hover:bg-muted/20 transition-all">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm font-medium text-foreground">Forcer la déconnexion</p>
                <p className="text-xs text-muted-foreground">Déconnecter toutes les sessions actives</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={forceLogout}
              onChange={(e) => setForceLogout(e.target.checked)}
              className="h-4 w-4 rounded border-muted-foreground/30 text-primary focus:ring-primary"
            />
          </label>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {isSaving ? "Modification..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
