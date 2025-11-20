/**
 * URL base del API
 *
 * En desarrollo local: 'http://localhost:3000'
 * En producción: La URL del load balancer (ej: 'http://load-balancer-dns/api')
 *
 * Esta variable DEBE ser configurada en el entorno donde se ejecuta la aplicación.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';


/**
 * URL base de la aplicación web
 */
export const APP_BASE_URL = process.env.NEXT_PUBLIC_URL || '/api';

/**
 * Modo de ambiente
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';