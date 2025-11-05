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
import { User, Briefcase } from "lucide-react";
import CompleteProfileModal from "./CompleteProfileModal";

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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"client" | "provider">("client");
  const [error, setError] = useState("");

  // Estado para controlar el segundo modal
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [basicData, setBasicData] = useState<{
    email: string;
    password: string;
    username: string;
  } | null>(null);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Validaciones básicas
      if (!username?.trim()) {
        throw new Error("El nombre completo es requerido");
      }

      if (username.trim().length < 3) {
        throw new Error("El nombre debe tener al menos 3 caracteres");
      }

      if (!email?.trim()) {
        throw new Error("El correo electrónico es requerido");
      }

      // Validación de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error("Ingresa un correo electrónico válido");
      }

      if (!password) {
        throw new Error("La contraseña es requerida");
      }

      if (password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }

      // Guardar datos básicos y abrir segundo modal
      setBasicData({
        email: email.trim(),
        password,
        username: username.trim(),
      });
      setShowCompleteProfile(true);
      onOpenChange(false); // Cerrar primer modal
    } catch (err) {
      console.error("Validation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error en la validación";
      setError(errorMessage);
    }
  };

  const handleCompleteProfileSuccess = () => {
    try {
      // Resetear formulario
      setUsername("");
      setEmail("");
      setPassword("");
      setUserType("client");
      setBasicData(null);
      setError("");

      // Mensaje de éxito y redirigir al login
      alert("¡Registro exitoso! Ahora puedes iniciar sesión");
      onSwitchToLogin();
    } catch (err) {
      console.error("Error in success handler:", err);
    }
  };

  return (
    <>
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

          <form onSubmit={handleContinue} className="space-y-4">
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
                  className={`flex flex-col items-center justify-center space-y-2 rounded-lg border-2 p-4 transition-all cursor-pointer ${
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
                  className={`flex flex-col items-center justify-center space-y-2 rounded-lg border-2 p-4 transition-all cursor-pointer ${
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            >
              Continuar
            </Button>

            <div className="text-center body-sm text-secondary">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-primary hover:text-[var(--color-primary-dark)] cursor-pointer"
              >
                Inicia sesión
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Segundo modal: Completar perfil */}
      {basicData && (
        <CompleteProfileModal
          open={showCompleteProfile}
          onOpenChange={setShowCompleteProfile}
          userType={userType}
          basicData={basicData}
          onSuccess={handleCompleteProfileSuccess}
        />
      )}
    </>
  );
}
