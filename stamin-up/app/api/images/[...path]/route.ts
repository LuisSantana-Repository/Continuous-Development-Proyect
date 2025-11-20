import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

/**
 * Proxy para servir imágenes desde el backend
 * Este endpoint redirige las peticiones de imágenes al API backend,
 * usando la URL correcta según el contexto (cliente o servidor)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Obtener la ruta completa de la imagen
    const imagePath = params.path.join('/');
    
    // Usar la URL del servidor para comunicación entre contenedores
    // Esta variable está disponible en el servidor (docker-compose.yml)
    const apiUrl = process.env.API_URL || API_BASE_URL;
    const imageUrl = `${apiUrl}/images/${imagePath}`;
    
    console.log('[Image Proxy] Fetching image:', imageUrl);
    
    // Hacer fetch de la imagen desde el backend
    const response = await fetch(imageUrl, {
      headers: {
        // Reenviar headers relevantes si existen
        ...(request.headers.get('accept') && { 'Accept': request.headers.get('accept')! }),
      },
    });
    
    if (!response.ok) {
      console.error('[Image Proxy] Failed to fetch image:', response.status, response.statusText);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Obtener el contenido de la imagen
    const imageBuffer = await response.arrayBuffer();
    
    // Obtener el content-type de la respuesta del backend
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Retornar la imagen con los headers apropiados
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error fetching image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
