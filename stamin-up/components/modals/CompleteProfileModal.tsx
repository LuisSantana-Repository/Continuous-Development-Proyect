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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Upload, Image as ImageIcon, X } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useCategories } from "@/hooks/useCategories";
import {
  fileToBase64,
  filesToBase64Array,
  getUserLocation,
  validateImageFile,
  validateMultipleImages,
  extractContentType,
} from "@/lib/fileUtils";

interface CompleteProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: "client" | "provider";
  basicData: {
    email: string;
    password: string;
    username: string;
  };
  onSuccess: () => void;
}

export default function CompleteProfileModal({
  open,
  onOpenChange,
  userType,
  basicData,
  onSuccess,
}: CompleteProfileModalProps) {
  // Datos comunes (Cliente y Proveedor)
  const [ineFile, setIneFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Datos específicos de Proveedor
  const [workname, setWorkname] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [jobPermitFile, setJobPermitFile] = useState<File | null>(null);
  const [workLocation, setWorkLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loadingWorkLocation, setLoadingWorkLocation] = useState(false);
  const [timeAvailable, setTimeAvailable] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Obtener categorías de servicios
  const { categories, loading: loadingCategories } = useCategories();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Handler para ubicación personal
  const handleGetLocation = async () => {
    try {
      setLoadingLocation(true);
      setError("");
      const coords = await getUserLocation();
      setLocation({ lat: coords.latitude, lng: coords.longitude });
    } catch (err) {
      console.error("Error getting location:", err);
      const errorMessage =
        err instanceof Error ? err.message : "No se pudo obtener la ubicación";
      setError(errorMessage);
      setLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Handler para ubicación del negocio
  const handleGetWorkLocation = async () => {
    try {
      setLoadingWorkLocation(true);
      setError("");
      const coords = await getUserLocation();
      setWorkLocation({ lat: coords.latitude, lng: coords.longitude });
    } catch (err) {
      console.error("Error getting work location:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "No se pudo obtener la ubicación del negocio";
      setError(errorMessage);
      setWorkLocation(null);
    } finally {
      setLoadingWorkLocation(false);
    }
  };

  // Usar ubicación personal como ubicación del negocio
  const handleUsePersonalLocation = () => {
    try {
      setError("");
      if (!location) {
        throw new Error("Primero debes obtener tu ubicación personal");
      }
      setWorkLocation({ ...location });
    } catch (err) {
      console.error("Error using personal location:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error al usar ubicación personal";
      setError(errorMessage);
    }
  };

  const handleIneChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      const file = e.target.files?.[0];

      if (!file) {
        setIneFile(null);
        return;
      }

      const validationError = validateImageFile(file, 5);
      if (validationError) {
        setError(validationError);
        setIneFile(null);
        // Limpiar el input
        e.target.value = "";
        return;
      }

      setIneFile(file);
    } catch (err) {
      console.error("Error handling INE file:", err);
      setError("Error al procesar el archivo de INE");
      setIneFile(null);
      e.target.value = "";
    }
  };

  const handleProfilePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      const file = e.target.files?.[0];

      if (!file) {
        setProfilePhotoFile(null);
        return;
      }

      const validationError = validateImageFile(file, 5);
      if (validationError) {
        setError(validationError);
        setProfilePhotoFile(null);
        e.target.value = "";
        return;
      }

      setProfilePhotoFile(file);
    } catch (err) {
      console.error("Error handling profile photo:", err);
      setError("Error al procesar la foto de perfil");
      setProfilePhotoFile(null);
      e.target.value = "";
    }
  };

  const handleJobPermitChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      const file = e.target.files?.[0];

      if (!file) {
        setJobPermitFile(null);
        return;
      }

      const validationError = validateImageFile(file, 5);
      if (validationError) {
        setError(validationError);
        setJobPermitFile(null);
        e.target.value = "";
        return;
      }

      setJobPermitFile(file);
    } catch (err) {
      console.error("Error handling job permit:", err);
      setError("Error al procesar el permiso de trabajo");
      setJobPermitFile(null);
      e.target.value = "";
    }
  };

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      const files = e.target.files;

      if (!files || files.length === 0) {
        setImageFiles([]);
        return;
      }

      const validationError = validateMultipleImages(files, 10, 5);
      if (validationError) {
        setError(validationError);
        setImageFiles([]);
        e.target.value = "";
        return;
      }

      setImageFiles(Array.from(files));
    } catch (err) {
      console.error("Error handling service images:", err);
      setError("Error al procesar las imágenes del servicio");
      setImageFiles([]);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    try {
      setError("");
      if (index < 0 || index >= imageFiles.length) {
        throw new Error("Índice de imagen inválido");
      }
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Error removing image:", err);
      setError("Error al eliminar la imagen");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validaciones comunes
      if (!ineFile) {
        throw new Error("Debes subir una foto de tu INE");
      }

      if (!location) {
        throw new Error("Debes proporcionar tu ubicación");
      }

      // Validaciones específicas para proveedores
      if (userType === "provider") {
        // Validar campos de texto
        if (!workname?.trim()) {
          throw new Error("El nombre del servicio es obligatorio");
        }
        if (!description?.trim()) {
          throw new Error("La descripción del servicio es obligatoria");
        }
        if (!basePrice?.trim()) {
          throw new Error("El precio base es obligatorio");
        }
        if (!serviceType || serviceType.trim() === "") {
          throw new Error("Debes seleccionar un tipo de servicio");
        }
        if (!timeAvailable?.trim()) {
          throw new Error("El horario disponible es obligatorio");
        }

        // Validar archivos
        if (!jobPermitFile) {
          throw new Error("Debes subir el permiso de trabajo");
        }
        if (!workLocation) {
          throw new Error("Debes proporcionar la ubicación del negocio");
        }
        if (imageFiles.length === 0) {
          throw new Error("Debes subir al menos una imagen del servicio");
        }

        // Validar formato de precio
        const price = Number(basePrice);
        if (isNaN(price) || price <= 0) {
          throw new Error("El precio base debe ser un número positivo");
        }
      }

      // Convertir archivos comunes a base64
      const ineBase64 = await fileToBase64(ineFile);
      const profilePhotoBase64 = profilePhotoFile
        ? await fileToBase64(profilePhotoFile)
        : undefined;

      // Preparar datos base
      const registerData: any = {
        email: basicData.email,
        password: basicData.password,
        username: basicData.username,
        provider: userType === "provider",
        INE: ineBase64,
        Foto: profilePhotoBase64,
        Latitude: location.lat,
        Longitude: location.lng,
      };

      // Si es proveedor, agregar datos del trabajo
      if (userType === "provider") {
        const jobPermitBase64 = await fileToBase64(jobPermitFile!);
        const jobPermitContentType = extractContentType(jobPermitBase64);
        const imagesBase64 = await filesToBase64Array(imageFiles);

        registerData.work = {
          workname: workname.trim(),
          description: description.trim(),
          base_price: Number(basePrice),
          Service_Type: serviceType.trim(), // Enviar como nombre de categoría (string)
          Job_Permit: {
            data: jobPermitBase64,
            contentType: jobPermitContentType || "image/jpeg",
          },
          Latitude: workLocation!.lat,
          Longitude: workLocation!.lng,
          Time_Available: timeAvailable.trim(),
          Images: imagesBase64,
        };
      }

      // Registrar usuario
      await apiClient.register(registerData);

      // Éxito - Mostrar mensaje de éxito brevemente antes de cerrar
      setSuccess(true);
      setError("");

      // Esperar un momento para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetForm();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Complete profile error:", err);

      // Manejo específico de errores con mensajes amigables
      let errorMessage =
        "Error al completar el perfil. Por favor, intenta nuevamente.";

      if (err instanceof Error) {
        const originalMessage = err.message.toLowerCase();

        // Mapear errores comunes a mensajes amigables
        if (
          originalMessage.includes("email already registered") ||
          originalMessage.includes("email is taken") ||
          originalMessage.includes("correo ya está registrado")
        ) {
          errorMessage =
            "Este correo electrónico ya está registrado. Por favor, usa otro correo o inicia sesión.";
        } else if (originalMessage.includes("invalid service type")) {
          errorMessage =
            "El tipo de servicio seleccionado no es válido. Por favor, selecciona otro.";
        } else if (originalMessage.includes("password")) {
          errorMessage =
            "La contraseña no cumple con los requisitos. Debe tener al menos 8 caracteres.";
        } else if (
          originalMessage.includes("coordinates") ||
          originalMessage.includes("location")
        ) {
          errorMessage =
            "Ubicación inválida. Por favor, obtén tu ubicación nuevamente.";
        } else if (
          originalMessage.includes("image") ||
          originalMessage.includes("file")
        ) {
          errorMessage =
            "Hay un problema con uno de los archivos. Verifica que sean imágenes válidas.";
        } else if (
          originalMessage.includes("network") ||
          originalMessage.includes("fetch")
        ) {
          errorMessage =
            "Error de conexión. Verifica tu internet e intenta nuevamente.";
        } else if (
          originalMessage.includes("server error") ||
          originalMessage.includes("500")
        ) {
          errorMessage =
            "Error del servidor. Por favor, intenta nuevamente en unos momentos.";
        } else if (
          originalMessage.includes("not found") ||
          originalMessage.includes("404")
        ) {
          errorMessage =
            "Servicio no disponible. Por favor, contacta al soporte.";
        } else {
          // Usar el mensaje original si es suficientemente descriptivo
          errorMessage = err.message;
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      // Mostrar el error sin romper el flujo
      setError(errorMessage);

      // Scroll suave al inicio del formulario para que el usuario vea el error
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        dialogContent.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIneFile(null);
    setProfilePhotoFile(null);
    setLocation(null);
    setWorkname("");
    setDescription("");
    setBasePrice("");
    setServiceType("");
    setJobPermitFile(null);
    setWorkLocation(null);
    setTimeAvailable("");
    setImageFiles([]);
    setError("");
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="heading-md text-primary">
            {userType === "provider"
              ? "Completa tu perfil de proveedor"
              : "Completa tu perfil"}
          </DialogTitle>
          <DialogDescription className="body-base text-secondary">
            {userType === "provider"
              ? "Agrega la información de tu servicio para empezar a recibir solicitudes"
              : "Solo necesitamos algunos datos adicionales"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto pr-2"
        >
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  ¡Registro exitoso!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Tu perfil ha sido creado correctamente. Redirigiendo...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Error al completar el registro
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* SECCIÓN COMÚN PARA TODOS */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-primary">Información personal</h3>

            {/* INE Upload */}
            <div className="space-y-2">
              <label className="body-sm font-medium text-secondary">
                Foto de tu INE *
              </label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="ine-upload"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                >
                  <Upload className="h-4 w-4 text-muted" />
                  <span className="body-sm text-secondary">
                    {ineFile ? ineFile.name : "Subir foto de INE"}
                  </span>
                </label>
                <input
                  id="ine-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleIneChange}
                  className="hidden"
                />
              </div>
              {ineFile && (
                <p className="text-xs text-green-600">✓ Archivo cargado</p>
              )}
            </div>

            {/* Profile Photo (opcional) */}
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
                      : "Subir foto de perfil"}
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
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="body-sm font-medium text-secondary">
                Tu ubicación *
              </label>
              <Button
                type="button"
                onClick={handleGetLocation}
                disabled={loadingLocation || !!location}
                variant="outline"
                className="w-full"
              >
                {loadingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Obteniendo ubicación...
                  </>
                ) : location ? (
                  <>
                    <MapPin className="mr-2 h-4 w-4 text-green-600" />
                    Ubicación obtenida ✓
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Obtener mi ubicación
                  </>
                )}
              </Button>
              {location && (
                <p className="text-xs text-muted-foreground">
                  Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* SECCIÓN EXCLUSIVA PARA PROVEEDORES */}
          {userType === "provider" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">
                Información del servicio
              </h3>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Nombre del servicio *
                </label>
                <Input
                  type="text"
                  placeholder="Ej: Plomería Profesional"
                  value={workname}
                  onChange={(e) => setWorkname(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Descripción del servicio *
                </label>
                <Textarea
                  placeholder="Describe tu servicio (mínimo 20 caracteres)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={20}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/1000 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Precio base *
                </label>
                <Input
                  type="number"
                  placeholder="500"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Tipo de servicio *
                </label>
                <Select
                  value={serviceType}
                  onValueChange={setServiceType}
                  disabled={loadingCategories}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Permiso de trabajo *
                </label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="job-permit-upload"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                  >
                    <Upload className="h-4 w-4 text-muted" />
                    <span className="body-sm text-secondary">
                      {jobPermitFile ? jobPermitFile.name : "Subir permiso"}
                    </span>
                  </label>
                  <input
                    id="job-permit-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleJobPermitChange}
                    className="hidden"
                  />
                </div>
                {jobPermitFile && (
                  <p className="text-xs text-green-600">✓ Archivo cargado</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Ubicación del negocio *
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleGetWorkLocation}
                    disabled={loadingWorkLocation || !!workLocation}
                    variant="outline"
                    className="flex-1"
                  >
                    {loadingWorkLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Obteniendo...
                      </>
                    ) : workLocation ? (
                      <>
                        <MapPin className="mr-2 h-4 w-4 text-green-600" />
                        Ubicación ✓
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Ubicación actual
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUsePersonalLocation}
                    disabled={!location}
                    variant="outline"
                  >
                    Usar mi ubicación
                  </Button>
                </div>
                {workLocation && (
                  <p className="text-xs text-muted-foreground">
                    Lat: {workLocation.lat.toFixed(4)}, Lng:{" "}
                    {workLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Horario disponible *
                </label>
                <Input
                  type="text"
                  placeholder="Ej: Lun-Vie 9:00-18:00"
                  value={timeAvailable}
                  onChange={(e) => setTimeAvailable(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="body-sm font-medium text-secondary">
                  Galería de imágenes * (mín. 1, máx. 10)
                </label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="images-upload"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                  >
                    <ImageIcon className="h-4 w-4 text-muted" />
                    <span className="body-sm text-secondary">
                      {imageFiles.length > 0
                        ? `${imageFiles.length} imagen(es) seleccionada(s)`
                        : "Seleccionar imágenes"}
                    </span>
                  </label>
                  <input
                    id="images-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="hidden"
                  />
                </div>
                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imageFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2"
                      >
                        <span className="text-xs truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || success}
            className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {success ? (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Registro exitoso
              </>
            ) : loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completando registro...
              </>
            ) : (
              "Completar registro"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
