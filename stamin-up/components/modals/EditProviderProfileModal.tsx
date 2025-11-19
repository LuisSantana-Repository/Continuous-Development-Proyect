"use client";

import { useState, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Briefcase, Mail, Upload } from "lucide-react";
import { fileToBase64, validateImageFile } from "@/lib/fileUtils";
import { validateEmail } from "@/lib/validators";
import type { ProviderUser } from "@/types";

interface EditProviderProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ProviderUser;
  onSave: (updates: {
    workname?: string;
    email?: string;
    Foto?: string;
  }) => Promise<void>;
}

export default function EditProviderProfileModal({
  open,
  onOpenChange,
  provider,
  onSave,
}: EditProviderProfileModalProps) {
  const [formData, setFormData] = useState({
    workname: provider.name,
    email: provider.email,
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    workname?: string;
    email?: string;
  }>({});

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar el error del campo cuando el usuario empiece a escribir
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError("");
  };

  const handleProfilePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProfilePhotoFile(null);
      return;
    }

    // Validar el archivo
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      setError(validationError);
      setProfilePhotoFile(null);
      return;
    }

    setProfilePhotoFile(file);
    setError("");
  };

  const validateWorkname = (workname: string): string | null => {
    if (!workname || typeof workname !== "string") {
      return "El nombre del servicio es requerido";
    }

    const trimmed = workname.trim();
    if (trimmed.length < 3) {
      return "El nombre del servicio debe tener al menos 3 caracteres";
    }

    if (trimmed.length > 100) {
      return "El nombre del servicio no puede exceder 100 caracteres";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      // Validar todos los campos antes de enviar
      const errors: { workname?: string; email?: string } = {};

      const worknameError = validateWorkname(formData.workname);
      if (worknameError) errors.workname = worknameError;

      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;

      // Si hay errores de validación, mostrarlos
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      const updates: {
        workname?: string;
        email?: string;
        Foto?: string;
      } = {
        workname: formData.workname,
        email: formData.email,
      };

      // Si hay una foto nueva, convertirla a base64
      if (profilePhotoFile) {
        const photoBase64 = await fileToBase64(profilePhotoFile);
        updates.Foto = photoBase64;
      }

      await onSave(updates);
      onOpenChange(false);
      // Mostrar mensaje de éxito
      alert("¡Perfil actualizado exitosamente!");
    } catch (err: any) {
      // Manejar errores específicos del backend
      const errorMessage =
        err?.message || err?.toString() || "Error desconocido";

      if (
        errorMessage.includes("email already in use") ||
        errorMessage.includes("email already registered")
      ) {
        setFieldErrors({
          email: "Este correo ya está registrado por otro usuario",
        });
      } else if (errorMessage.includes("invalid email format")) {
        setFieldErrors({
          email: "El formato del correo electrónico no es válido",
        });
      } else {
        setError(
          "No se pudo actualizar el perfil. Por favor, inténtalo nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setFormData({
      workname: provider.name,
      email: provider.email,
    });
    setProfilePhotoFile(null);
    setError("");
    setFieldErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="heading-md text-primary">
            Editar perfil de proveedor
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            Actualiza la información de tu servicio. Los cambios se guardarán al
            confirmar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-[var(--color-error)]/10 p-3 body-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          {/* Campo Nombre del Servicio */}
          <div className="space-y-2">
            <label
              htmlFor="workname"
              className="body-sm font-medium text-secondary flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4 text-primary" />
              Nombre del servicio
            </label>
            <Input
              id="workname"
              type="text"
              placeholder="Nombre de tu servicio"
              value={formData.workname}
              onChange={(e) => handleChange("workname", e.target.value)}
              required
              className={`w-full ${
                fieldErrors.workname ? "border-red-500" : ""
              }`}
            />
            {fieldErrors.workname && (
              <p className="text-xs text-red-500">{fieldErrors.workname}</p>
            )}
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
              className={`w-full ${fieldErrors.email ? "border-red-500" : ""}`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          {/* Campo Foto de perfil */}
          <div className="space-y-2">
            <label className="body-sm font-medium text-secondary">
              Foto de perfil (opcional)
            </label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="profile-photo-upload"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-primary)] transition-colors"
              >
                <Upload className="h-4 w-4 text-muted" />
                <span className="body-sm text-secondary">
                  {profilePhotoFile
                    ? profilePhotoFile.name
                    : "Subir nueva foto de perfil"}
                </span>
              </label>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                className="hidden"
              />
            </div>
            {profilePhotoFile && (
              <p className="text-xs text-green-600">✓ Archivo cargado</p>
            )}
            <p className="text-xs text-muted">
              Si no seleccionas una foto, se mantendrá la actual
            </p>
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
