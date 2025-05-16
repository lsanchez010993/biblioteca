import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { crearCarpeta, existeCarpeta } from './logica.js';


const NOMBRE_CARPETA="libros";

const app = express();
app.use(cors());
app.use(express.json());

const HTTP_PORT = 8081;

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Aceptar solo archivos EPUB
const upload = multer({
  storage: multer.memoryStorage(), 
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.epub') {
      return cb(new Error('Solo se permiten archivos EPUB'));
    }
    cb(null, true);
  }
});

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, '../public')));

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

//DRIVE//

// const credencials = JSON.parse(fs.readFileSync('./private/practicacliente-452309-d984bcde101d.json', {encoding:'utf8'})); //personal
const credencials = JSON.parse(fs.readFileSync('./private/pagina-web-php-1731940242594-0eab40d16bac.json', { encoding: 'utf8' })); //Sapalomera.cat
const auth = new google.auth.GoogleAuth({
  credentials: credencials,
  scopes: ['https://www.googleapis.com/auth/drive'] 
});
export const driveClient = google.drive({ version: 'v3', auth });





//subir libro a drive:

app.post('/upload', upload.single('epubFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha proporcionado un archivo.' });
  }

  try {
    //comprobar si existe carpeta. Si no existe, se crea y se asigna su ID a parentId
    let parentId = await existeCarpeta(NOMBRE_CARPETA);
    
    if (!parentId) {
      parentId = await crearCarpeta(NOMBRE_CARPETA);
      if (parentId) {
        console.log("Carpeta 'libros' creada con éxito");
      }
    }

    const readableStream = Readable.from(req.file.buffer);

    const driveResponse = await driveClient.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [parentId], 
      },
      media: {
        mimeType: req.file.mimetype, 
        body: readableStream
      }
    });

    res.json({
      message: 'Archivo subido a Google Drive correctamente',
      fileId: driveResponse.data.id,
      folderId: parentId
    });
  } catch (error) {
    console.error('Error subiendo archivo a Google Drive:', error);
    res.status(500).json({
      error: 'Error subiendo archivo a Google Drive',
      detalle: error.message
    });
  }
});



app.get('/listarLibros', async (req, res) => {
  try {
  
    let parentId = await existeCarpeta(NOMBRE_CARPETA);
    // Si no existe la carpeta se crea y se asigna su ID a parentId
    if (!parentId) {
      parentId = await crearCarpeta(NOMBRE_CARPETA);
      if (parentId) {
        console.log("Carpeta 'libros' creada con éxito");
      }
    }

    // Lista solo los archivos dentro de la carpeta "libros"
    const response = await driveClient.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 100
    });

    res.json(response.data.files);
  } catch (error) {
    console.error('Error al listar archivos en la carpeta libros:', error);
    res.status(500).json({ error: 'Error al listar archivos en la carpeta libros' });
  }
});




app.delete("/eliminarLibro", async (req, res) => {
  const fileId = req.query.fileId;
  console.log(fileId);

  if (!fileId) {
    return res.status(400).json({ error: "Se requiere el fileId del libro." });
  }

  try {
    await driveClient.files.delete({ fileId });
    console.log(`Archivo con ID ${fileId} eliminado exitosamente.`);
    res.json({ message: "Archivo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el archivo:", error.message);
    res.status(500).json({ error: "Error al eliminar el archivo" });
  }
});


app.get('/leerEPUB', async (req, res) => {
  const fileId = req.query.fileId;
  if (!fileId) {
    return res.status(400).json({ error: 'No se proporcionó fileId.' });
  }
  try {
    const driveRes = await driveClient.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    // Establece el Content-Type para archivos EPUB
    res.setHeader('Content-Type', 'application/epub+zip');
    driveRes.data.pipe(res);
  } catch (error) {
    console.error('Error leyendo el archivo de Drive:', error);
    res.status(500).json({ error: 'Error al leer el archivo.' });
  }
});



app.listen(HTTP_PORT, () => {
  console.log(`Servidor HTTP escuchando en http://localhost:${HTTP_PORT}`);
});


