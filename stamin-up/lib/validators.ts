/**
 * Validadores para el frontend
 * Basados en las validaciones del backend para mantener consistencia
 */

/**
 * Valida que el formato del email sea correcto
 * @param email - Email a validar
 * @returns true si el formato es válido, false en caso contrario
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida que el nombre de usuario tenga el formato correcto
 * @param username - Nombre de usuario a validar
 * @returns null si es válido, mensaje de error si no
 */
export function validateUsername(username: string): string | null {
  if (!username || typeof username !== 'string') {
    return 'El nombre es requerido';
  }
  
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres';
  }
  
  if (trimmed.length > 100) {
    return 'El nombre no puede exceder 100 caracteres';
  }
  
  return null;
}

/**
 * Valida que el email tenga el formato correcto
 * @param email - Email a validar
 * @returns null si es válido, mensaje de error si no
 */
export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return 'El correo electrónico es requerido';
  }
  
  if (!isValidEmailFormat(email)) {
    return 'El formato del correo electrónico no es válido';
  }
  
  return null;
}

/**
 * Valida que la dirección tenga el formato correcto
 * @param address - Dirección a validar
 * @returns null si es válido, mensaje de error si no
 */
export function validateAddress(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return 'La dirección es requerida';
  }
  
  const trimmed = address.trim();
  if (trimmed.length < 10) {
    return 'La dirección debe tener al menos 10 caracteres';
  }
  
  if (trimmed.length > 500) {
    return 'La dirección no puede exceder 500 caracteres';
  }
  
  return null;
}