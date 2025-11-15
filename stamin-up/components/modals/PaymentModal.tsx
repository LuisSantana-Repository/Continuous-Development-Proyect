"use client";

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
import { CreditCard, Lock, CheckCircle } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";
import {
  validatePaymentForm,
  formatCardNumber,
  formatExpiryDate,
  getCardType,
  type PaymentFormData,
  type PaymentValidationErrors,
} from "@/lib/paymentValidation";
import type { Order } from "@/types";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess: () => void;
}

export default function PaymentModal({
  open,
  onOpenChange,
  order,
  onSuccess,
}: PaymentModalProps) {
  const { processPayment, isProcessing } = usePayment();

  // Estados del formulario
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  // Estados de validación
  const [errors, setErrors] = useState<PaymentValidationErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const cardType = getCardType(cardNumber);

  const handleCardNumberChange = (value: string) => {
    // Remover todo excepto dígitos
    const digitsOnly = value.replace(/\D/g, "");

    // Limitar a 16 dígitos (o 19 para algunas tarjetas)
    if (digitsOnly.length <= 16) {
      const formatted = formatCardNumber(digitsOnly);
      setCardNumber(formatted);
      if (errors.cardNumber) {
        setErrors({ ...errors, cardNumber: undefined });
      }
    }
  };

  const handleExpiryDateChange = (value: string) => {
    const formatted = formatExpiryDate(value);
    if (formatted.replace(/\D/g, "").length <= 4) {
      setExpiryDate(formatted);
      if (errors.expiryDate) {
        setErrors({ ...errors, expiryDate: undefined });
      }
    }
  };

  const handleCvvChange = (value: string) => {
    if (/^\d{0,4}$/.test(value)) {
      setCvv(value);
      if (errors.cvv) {
        setErrors({ ...errors, cvv: undefined });
      }
    }
  };

  const handleCardholderNameChange = (value: string) => {
    setCardholderName(value);
    if (errors.cardholderName) {
      setErrors({ ...errors, cardholderName: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Separar mes y año
    const [month, year] = expiryDate.split("/");

    // Validar formulario
    const formData: PaymentFormData = {
      cardNumber,
      expiryMonth: month || "",
      expiryYear: year || "",
      cvv,
      cardholderName,
    };

    const validationErrors = validatePaymentForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await processPayment(order.id, formData);

      // Mostrar mensaje de éxito
      setShowSuccess(true);

      // Esperar 2 segundos y cerrar modal
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onOpenChange(false);
        // Limpiar formulario
        setCardNumber("");
        setExpiryDate("");
        setCvv("");
        setCardholderName("");
        setErrors({});
      }, 2000);
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  const handleClose = () => {
    if (!isProcessing && !showSuccess) {
      onOpenChange(false);
      // Limpiar formulario al cerrar
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardholderName("");
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[var(--color-primary)]" />
                Procesar Pago
              </DialogTitle>
              <DialogDescription>
                Complete los datos de su tarjeta para proceder con el pago
              </DialogDescription>
            </DialogHeader>

            {/* Resumen del Pago */}
            <div className="bg-[var(--color-background-secondary)] rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                Resumen del Servicio
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">
                    Proveedor:
                  </span>
                  <span className="font-medium">{order.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">
                    Servicio:
                  </span>
                  <span className="font-medium">{order.serviceName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--color-border-light)]">
                  <span className="font-semibold">Total a pagar:</span>
                  <span className="font-bold text-[var(--color-primary)] text-lg">
                    ${order.price.toLocaleString("es-MX")} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario de Pago */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Número de Tarjeta */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className={errors.cardNumber ? "border-red-500" : ""}
                    disabled={isProcessing}
                  />
                  {cardType !== "Desconocida" && cardNumber.length > 4 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-text-secondary)]">
                      {cardType}
                    </span>
                  )}
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-500">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Fecha de Expiración */}
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Fecha de Expiración</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => handleExpiryDateChange(e.target.value)}
                    className={errors.expiryDate ? "border-red-500" : ""}
                    disabled={isProcessing}
                  />
                  {errors.expiryDate && (
                    <p className="text-xs text-red-500">{errors.expiryDate}</p>
                  )}
                </div>

                {/* CVV */}
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => handleCvvChange(e.target.value)}
                    className={errors.cvv ? "border-red-500" : ""}
                    disabled={isProcessing}
                    maxLength={4}
                  />
                  {errors.cvv && (
                    <p className="text-xs text-red-500">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Nombre del Titular */}
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Nombre del Titular</Label>
                <Input
                  id="cardholderName"
                  placeholder="JUAN PEREZ"
                  value={cardholderName}
                  onChange={(e) =>
                    handleCardholderNameChange(e.target.value.toUpperCase())
                  }
                  className={errors.cardholderName ? "border-red-500" : ""}
                  disabled={isProcessing}
                />
                {errors.cardholderName && (
                  <p className="text-xs text-red-500">
                    {errors.cardholderName}
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Procesando...
                    </>
                  ) : (
                    "Pagar Ahora"
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* Mensaje de Éxito */
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                ¡Pago Exitoso!
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                El servicio ha pasado a estado "En Progreso"
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Monto: ${order.price.toLocaleString("es-MX")} MXN
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
