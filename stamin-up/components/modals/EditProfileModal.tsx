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
import { Loader2, User, Mail, Phone, MapPin, Upload } from "lucide-react";
import { fileToBase64, validateImageFile } from "@/lib/fileUtils";
import {
  validateEmail,
  validateUsername,
  validateAddress,
} from "@/lib/validators";
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
    address: user.address,
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    address?: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      // Validar todos los campos antes de enviar
      const errors: { name?: string; email?: string; address?: string } = {};

      const nameError = validateUsername(formData.name);
      if (nameError) errors.name = nameError;

      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;

      const addressError = validateAddress(formData.address);
      if (addressError) errors.address = addressError;

      // Si hay errores de validación, mostrarlos
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      const updates: any = {
        username: formData.name,
        email: formData.email,
        address: formData.address,
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
      name: user.name,
      email: user.email,
      address: user.address,
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
              className={`w-full ${fieldErrors.name ? "border-red-500" : ""}`}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-500">{fieldErrors.name}</p>
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
              className={`w-full ${
                fieldErrors.address ? "border-red-500" : ""
              }`}
            />
            {fieldErrors.address && (
              <p className="text-xs text-red-500">{fieldErrors.address}</p>
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
