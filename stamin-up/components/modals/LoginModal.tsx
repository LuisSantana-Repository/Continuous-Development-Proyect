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
import { Loader2 } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({
  open,
  onOpenChange,
  onSwitchToRegister,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // await login(email, password);
      onOpenChange(false);
      setEmail("");
      setPassword("");
      // Mostrar mensaje de éxito
      alert("¡Inicio de sesión exitoso!");
    } catch (err) {
      setError("Credenciales inválidas. Por favor, verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="heading-md text-primary">
            Iniciar sesión
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Ingresa a tu cuenta para acceder a todos los servicios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-[var(--color-error)]/10 p-3 body-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="body-sm font-medium text-secondary"
            >
              Correo electrónico
            </label>
            <Input
              id="email"
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
              htmlFor="password"
              className="body-sm font-medium text-secondary"
            >
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
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
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          <div className="text-center body-sm text-secondary">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium text-primary hover:text-[var(--color-primary-dark)]"
            >
              Regístrate aquí
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
