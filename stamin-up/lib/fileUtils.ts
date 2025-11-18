/**
 * Convierte un archivo a base64
 * @param file - Archivo a convertir
 * @returns Promise con el string base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Valida que un archivo sea una imagen y no exceda el tamaño máximo
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (default: 5)
 * @returns true si es válido, error message si no
 */
export const validateImageFile = (file: File, maxSizeMB: number = 5): string | null => {
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    return 'El archivo debe ser una imagen';
  }

  // Validar tamaño
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `La imagen no debe exceder ${maxSizeMB}MB`;
  }

  return null;
};

/**
 * Convierte múltiples archivos a un array de base64
 * @param files - Lista de archivos (FileList o File[])
 * @returns Promise con array de strings base64
 */
export const filesToBase64Array = async (files: FileList | File[]): Promise<string[]> => {
  const fileArray = Array.from(files);
  const base64Promises = fileArray.map(file => fileToBase64(file));
  return Promise.all(base64Promises);
};

/**
 * Valida múltiples archivos de imágenes
 * @param files - Lista de archivos
 * @param maxFiles - Número máximo de archivos permitidos (default: 10)
 * @param maxSizeMB - Tamaño máximo por imagen en MB (default: 5)
 * @returns null si todo es válido, o mensaje de error
 */
export const validateMultipleImages = (
  files: FileList | File[],
  maxFiles: number = 10,
  maxSizeMB: number = 5
): string | null => {
  const fileArray = Array.from(files);

  // Validar cantidad
  if (fileArray.length === 0) {
    return 'Debes seleccionar al menos una imagen';
  }

  if (fileArray.length > maxFiles) {
    return `Máximo ${maxFiles} imágenes permitidas`;
  }

  // Validar cada archivo
  for (let i = 0; i < fileArray.length; i++) {
    const error = validateImageFile(fileArray[i], maxSizeMB);
    if (error) {
      return `Imagen ${i + 1}: ${error}`;
    }
  }

  return null;
};

/**
 * Extrae el content type de un string base64
 * @param base64String - String base64 con formato "data:image/jpeg;base64,..."
 * @returns Content type (ej: "image/jpeg") o null si no es válido
 */
export const extractContentType = (base64String: string): string | null => {
  const match = base64String.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
};
