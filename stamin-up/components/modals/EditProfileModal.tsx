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
import { Loader2, User, Mail, Phone, MapPin } from "lucide-react";
import type { ClientUser } from "@/types";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ClientUser;
  onSave: (updatedUser: Partial<ClientUser>) => Promise<void>;
}

export default function EditProfileModal({
  open,
  onOpenChange,
  user,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSave(formData);
      onOpenChange(false);
      // Mostrar mensaje de éxito
      alert("¡Perfil actualizado exitosamente!");
    } catch (err) {
      setError(
        "No se pudo actualizar el perfil. Por favor, inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    });
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="heading-md text-primary">
            Editar perfil
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Actualiza tu información personal. Los cambios se guardarán al
            confirmar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-[var(--color-error)]/10 p-3 body-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          {/* Campo Nombre */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="body-sm font-medium text-secondary flex items-center gap-2"
            >
              <User className="h-4 w-4 text-primary" />
              Nombre completo
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre completo"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Campo Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="body-sm font-medium text-secondary flex items-center gap-2"
            >
              <Mail className="h-4 w-4 text-primary" />
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Campo Teléfono */}
          {/* <div className="space-y-2">
            <label
              htmlFor="phone"
              className="body-sm font-medium text-secondary flex items-center gap-2"
            >
              <Phone className="h-4 w-4 text-primary" />
              Teléfono
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+52 123 456 7890"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
              className="w-full"
            />
          </div> */}

          {/* Campo Dirección */}
          <div className="space-y-2">
            <label
              htmlFor="address"
              className="body-sm font-medium text-secondary flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Dirección
            </label>
            <Input
              id="address"
              type="text"
              placeholder="Tu dirección completa"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
