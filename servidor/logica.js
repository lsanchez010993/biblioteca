import { driveClient } from './servidor.js';

export async function existeCarpeta(nombreCarpeta) {

  const respuesta = await driveClient.files.list({
    q: `name='${nombreCarpeta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (respuesta.data.files.length > 0) {
    // console.log(`Carpeta encontrada: ${respuesta.data.files[0].id}`);
    return respuesta.data.files[0].id; // Devolver el ID de la carpeta 
  }
}


export async function crearCarpeta(nombreCarpeta) {
    
  
    try {
    
      // Si no existe, crearla
      const metadata = {
        name: nombreCarpeta,
        mimeType: 'application/vnd.google-apps.folder'
      };
  
      const nuevaCarpeta = await driveClient.files.create({
        requestBody: metadata,
        fields: 'id'
      });
  
      console.log(`Carpeta creada con ID: ${nuevaCarpeta.data.id}`);
      return nuevaCarpeta.data.id;
    } catch (error) {
      console.error('Error al obtener o crear la carpeta:', error);
      throw new Error('No se pudo obtener o crear la carpeta en Google Drive');
    }
  }
  