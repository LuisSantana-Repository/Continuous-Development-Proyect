"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Briefcase } from "lucide-react";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({
  open,
  onOpenChange,
  onSwitchToLogin,
}: RegisterModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"client" | "provider">("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // await register(email, password, name, userType);
      onOpenChange(false);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setUserType("client");
      // Mostrar mensaje de éxito
      alert("¡Registro exitoso! Bienvenido a Stamin-Up");
    } catch (err) {
      setError("Error en el registro. Por favor, verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="heading-md text-primary">
            Crear cuenta
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Únete a Stamin-Up y encuentra los mejores profesionales
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-[var(--color-error)]/10 p-3 body-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          {/* User Type Selection */}
          <div className="space-y-2">
            <label className="body-sm font-medium text-secondary">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("client")}
                className={`flex flex-col items-center justify-center space-y-2 rounded-lg border-2 p-4 transition-all ${
                  userType === "client"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-border)]"
                }`}
              >
                <User
                  className={`h-8 w-8 ${
                    userType === "client" ? "text-primary" : "text-muted"
                  }`}
                />
                <span className="body-sm font-medium">Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => setUserType("provider")}
                className={`flex flex-col items-center justify-center space-y-2 rounded-lg border-2 p-4 transition-all ${
                  userType === "provider"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-border)]"
                }`}
              >
                <Briefcase
                  className={`h-8 w-8 ${
                    userType === "provider" ? "text-primary" : "text-muted"
                  }`}
                />
                <span className="body-sm font-medium">Proveedor</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="name"
              className="body-sm font-medium text-secondary"
            >
              Nombre completo
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-email"
              className="body-sm font-medium text-secondary"
            >
              Correo electrónico
            </label>
            <Input
              id="register-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-password"
              className="body-sm font-medium text-secondary"
            >
              Contraseña
            </label>
            <Input
              id="register-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>

          <div className="text-center body-sm text-secondary">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-primary hover:text-[var(--color-primary-dark)]"
            >
              Inicia sesión
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
