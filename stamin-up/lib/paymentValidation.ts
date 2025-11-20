/**
 * Utilidades para validación de datos de tarjetas de crédito/débito
 * NOTA: Esto es solo para SIMULACIÓN, no guardar datos reales de tarjetas
 */

/**
 * Detecta el tipo de tarjeta basado en el número
 */
export function getCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  
  return 'Desconocida';
}

/**
 * Valida el número de tarjeta (solo verifica que sean 16 dígitos)
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Verificar que solo contenga dígitos y que sean exactamente 16
  return /^\d{16}$/.test(cleaned);
}

/**
 * Valida la fecha de expiración
 */
export function validateExpiryDate(month: string, year: string): boolean {
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  // Validar formato
  if (isNaN(monthNum) || isNaN(yearNum)) {
    return false;
  }
  
  // Validar mes (1-12)
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }
  
  // Obtener fecha actual
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Últimos 2 dígitos
  const currentMonth = now.getMonth() + 1;
  
  // Validar que no esté vencida
  if (yearNum < currentYear) {
    return false;
  }
  
  if (yearNum === currentYear && monthNum < currentMonth) {
    return false;
  }
  
  return true;
}

/**
 * Valida el CVV
 */
export function validateCVV(cvv: string, cardType?: string): boolean {
  // American Express usa 4 dígitos, otros 3
  const expectedLength = cardType === 'American Express' ? 4 : 3;
  
  if (!/^\d+$/.test(cvv)) {
    return false;
  }
  
  return cvv.length === expectedLength;
}

/**
 * Valida el nombre del titular
 */
export function validateCardholderName(name: string): boolean {
  // Debe tener al menos 3 caracteres y solo letras y espacios
  if (name.length < 3) {
    return false;
  }
  
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
    return false;
  }
  
  return true;
}

/**
 * Formatea el número de tarjeta (agrega espacios cada 4 dígitos)
 */
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '');
  const chunks = cleaned.match(/.{1,4}/g) || [];
  return chunks.join(' ');
}

/**
 * Formatea la fecha de expiración (MM/YY)
 */
export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

/**
 * Valida todos los datos del formulario de pago
 */
export interface PaymentFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export interface PaymentValidationErrors {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

export function validatePaymentForm(data: PaymentFormData): PaymentValidationErrors {
  const errors: PaymentValidationErrors = {};
  
  // Validar número de tarjeta
  if (!validateCardNumber(data.cardNumber)) {
    errors.cardNumber = 'Número de tarjeta inválido';
  }
  
  // Validar fecha de expiración
  if (!validateExpiryDate(data.expiryMonth, data.expiryYear)) {
    errors.expiryDate = 'Fecha de expiración inválida o vencida';
  }
  
  // Validar CVV
  const cardType = getCardType(data.cardNumber);
  if (!validateCVV(data.cvv, cardType)) {
    errors.cvv = `CVV debe tener ${cardType === 'American Express' ? '4' : '3'} dígitos`;
  }
  
  // Validar nombre del titular
  if (!validateCardholderName(data.cardholderName)) {
    errors.cardholderName = 'Nombre inválido (mínimo 3 caracteres, solo letras)';
  }
  
  return errors;
}
