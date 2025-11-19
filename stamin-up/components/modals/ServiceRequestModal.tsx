"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateServiceRequest } from "@/hooks/useCreateServiceRequest";
import type { Service, ServiceRequestResponse } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Loader2,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

interface ServiceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  userId: string;
}

interface FormData {
  preferredDate: string;
  address: string;
  contactPhone: string;
  description: string;
}

interface FormErrors {
  preferredDate?: string;
  address?: string;
  contactPhone?: string;
  description?: string;
}

/**
 * Modal para crear una solicitud de servicio (Service Request / Booking)
 * Componente accesible y responsive con validaciones completas
 */
export function ServiceRequestModal({
  open,
  onOpenChange,
  service,
  userId,
}: ServiceRequestModalProps) {
  const router = useRouter();
  const { createRequest, isSubmitting, error, clearError } =
    useCreateServiceRequest();

  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    preferredDate: "",
    address: "",
    contactPhone: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Estados para confirmación
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestResult, setRequestResult] =
    useState<ServiceRequestResponse | null>(null);

  // Ref para focus management
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus al primer input cuando se abre el modal
  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Resetear formulario al cerrar
  useEffect(() => {
    if (!open) {
      setFormData({
        preferredDate: "",
        address: "",
        contactPhone: "",
        description: "",
      });
      setFormErrors({});
      setTouched({});
      clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Solo depende de 'open', clearError está memoizado con useCallback

  // Validación de fecha mínima (fecha-hora actual)
  const getMinDateTime = () => {
    const now = new Date();
    // Formato: YYYY-MM-DDTHH:MM
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Validar un campo específico
  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case "preferredDate":
        if (!value) return "La fecha preferida es requerida";
        const selectedDate = new Date(value);
        const now = new Date();
        if (selectedDate <= now) {
          return "La fecha debe ser posterior a la fecha y hora actual";
        }
        break;

      case "address":
        if (!value.trim()) return "La dirección es requerida";
        if (value.trim().length < 5)
          return "La dirección debe tener al menos 5 caracteres";
        break;

      case "contactPhone":
        if (!value.trim()) return "El teléfono de contacto es requerido";
        // Pattern básico: números, espacios, guiones, paréntesis y +
        const phonePattern = /^[\d\s\-+()]+$/;
        if (!phonePattern.test(value)) {
          return "El teléfono solo puede contener números, +, espacios, guiones y paréntesis";
        }
        if (value.replace(/\D/g, "").length < 8) {
          return "El teléfono debe tener al menos 8 dígitos";
        }
        break;

      case "description":
        if (!value.trim()) return "La descripción es requerida";
        if (value.trim().length < 10) {
          return "La descripción debe tener al menos 10 caracteres";
        }
        break;
    }
    return undefined;
  };

  // Validar todo el formulario
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambios en los campos
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validar en tiempo real si el campo ya fue tocado
    if (touched[name]) {
      const error = validateField(name as keyof FormData, value);
      setFormErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  // Manejar blur (cuando el usuario sale del campo)
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(
      name as keyof FormData,
      formData[name as keyof FormData]
    );
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos los campos como tocados
    setTouched({
      preferredDate: true,
      address: true,
      contactPhone: true,
      description: true,
    });

    // Validar formulario completo
    if (!validateForm()) {
      return;
    }

    try {
      const result = await createRequest({
        serviceId: service.id,
        userId,
        preferredDate: new Date(formData.preferredDate).toISOString(),
        address: formData.address.trim(),
        contactPhone: formData.contactPhone.trim(),
        description: formData.description.trim(),
        amount: service.price,
      });

      // Construir el objeto completo con los datos del formulario
      const completeResult: ServiceRequestResponse = {
        ...result,
        serviceRequest: {
          requestId: result.requestId,
          serviceId: service.id,
          userId,
          preferredDate: new Date(formData.preferredDate).toISOString(),
          address: formData.address.trim(),
          contactPhone: formData.contactPhone.trim(),
          description: formData.description.trim(),
          amount: service.price,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      };

      setRequestResult(completeResult);
      setShowConfirmation(true);
      onOpenChange(false);
    } catch (err) {
      // El error ya está manejado por el hook
      console.error("Error creating service request:", err);
    }
  };

  // Manejar tecla Enter para enviar formulario
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      e.target instanceof HTMLInputElement
    ) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString("es-ES", {
      dateStyle: "long",
      timeStyle: "short",
    });
  };

  // Cerrar modal de confirmación
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setRequestResult(null);
  };

  // Redirigir al chat creado
  const handleInitiateChat = () => {
    if (requestResult?.chatId) {
      // Cerrar todos los modales
      setShowConfirmation(false);
      setRequestResult(null);
      onOpenChange(false);

      // Redirigir al chat
      router.push(`/chat/${requestResult.chatId}`);
    } else {
      // Si no hay chatId, mostrar error en consola y cerrar modal
      console.error("No chatId available in request result:", requestResult);
      setShowConfirmation(false);
      setRequestResult(null);
      onOpenChange(false);
    }
  };

  return (
    <>
      {/* Modal principal del formulario */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold">
              Solicitar servicio — {service.title}
            </DialogTitle>
            <DialogDescription>
              Completa los datos para solicitar este servicio. Comenzara un chat
              con el prveedor.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="space-y-5 overflow-y-auto flex-1 pr-1"
          >
            {/* Fecha preferida */}
            <div className="space-y-2">
              <Label
                htmlFor="preferredDate"
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Fecha y hora preferida
                <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={firstInputRef}
                id="preferredDate"
                name="preferredDate"
                type="datetime-local"
                value={formData.preferredDate}
                onChange={handleChange}
                onBlur={handleBlur}
                min={getMinDateTime()}
                aria-invalid={!!formErrors.preferredDate}
                aria-describedby={
                  formErrors.preferredDate
                    ? "preferredDate-error"
                    : "preferredDate-help"
                }
                disabled={isSubmitting}
                className="w-full"
              />
              {!formErrors.preferredDate && (
                <p
                  id="preferredDate-help"
                  className="text-xs text-muted-foreground"
                >
                  Selecciona cuándo te gustaría recibir el servicio
                </p>
              )}
              {formErrors.preferredDate && (
                <p
                  id="preferredDate-error"
                  role="alert"
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.preferredDate}
                </p>
              )}
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección del servicio
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="Ej: Av. Principal 123, Ciudad"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!formErrors.address}
                aria-describedby={
                  formErrors.address ? "address-error" : "address-help"
                }
                disabled={isSubmitting}
              />
              {!formErrors.address && (
                <p id="address-help" className="text-xs text-muted-foreground">
                  Indica dónde se realizará el servicio
                </p>
              )}
              {formErrors.address && (
                <p
                  id="address-error"
                  role="alert"
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.address}
                </p>
              )}
            </div>

            {/* Teléfono de contacto */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono de contacto
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                placeholder="Ej: +52 55 1234 5678"
                value={formData.contactPhone}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!formErrors.contactPhone}
                aria-describedby={
                  formErrors.contactPhone
                    ? "contactPhone-error"
                    : "contactPhone-help"
                }
                disabled={isSubmitting}
              />
              {!formErrors.contactPhone && (
                <p
                  id="contactPhone-help"
                  className="text-xs text-muted-foreground"
                >
                  Número donde podemos contactarte para coordinar el servicio
                </p>
              )}
              {formErrors.contactPhone && (
                <p
                  id="contactPhone-error"
                  role="alert"
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.contactPhone}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descripción del trabajo
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe los detalles del servicio que necesitas..."
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                aria-invalid={!!formErrors.description}
                aria-describedby={
                  formErrors.description
                    ? "description-error"
                    : "description-help"
                }
                disabled={isSubmitting}
                className="resize-none"
              />
              {!formErrors.description && (
                <p
                  id="description-help"
                  className="text-xs text-muted-foreground"
                >
                  Mínimo 10 caracteres. Incluye todos los detalles relevantes
                </p>
              )}
              {formErrors.description && (
                <p
                  id="description-error"
                  role="alert"
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.description}
                </p>
              )}
            </div>

            {/* Precio estimado */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Precio:</span>
                <span className="text-lg font-bold text-primary">
                  ${service.price.toFixed(2)}
                  {service.priceType === "hourly" && " /hora"}
                  {service.priceType === "negotiable" && " (negociable)"}
                </span>
              </div>
            </div>

            {/* Error general */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive bg-destructive/10 p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Error al enviar la solicitud
                  </p>
                  <p className="text-sm text-destructive/90">{error}</p>
                </div>
              </div>
            )}
          </form>

          {/* Footer con botones fuera del form */}
          <DialogFooter className="gap-2 flex-shrink-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar solicitud"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación exitosa */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              ¡Solicitud enviada con éxito!
            </AlertDialogTitle>
          </AlertDialogHeader>

          {/* Contenido sin AlertDialogDescription para evitar <p> anidados */}
          <div className="text-center space-y-3 text-muted-foreground text-sm">
            <p>Tu solicitud ha sido enviada al proveedor del servicio.</p>

            {requestResult && (
              <div className="bg-muted rounded-lg p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ID de solicitud:
                  </span>
                  <span className="font-mono font-semibold">
                    {requestResult.requestId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Fecha solicitada:
                  </span>
                  <span className="font-medium">
                    {requestResult.serviceRequest?.preferredDate
                      ? formatDate(requestResult.serviceRequest.preferredDate)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium">
                    Pendiente
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm">
              Recibirás una notificación cuando el proveedor responda a tu
              solicitud.
            </p>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCloseConfirmation}>
              Cerrar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleInitiateChat} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Iniciar chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
