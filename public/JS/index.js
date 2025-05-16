document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('epubInput');
  const subirBtn = document.getElementById('subirBtn');

  const listadoLibros = document.getElementById('listadoLibros');

  // Subir archivo EPUB
  subirBtn.addEventListener('click', () => {
    const file = fileInput.files[0];

    if (!file) {
      alert('Por favor, selecciona un archivo EPUB.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.epub')) {
      alert('El archivo debe tener la extensión .epub');
      return;
    }

    const formData = new FormData();
    formData.append('epubFile', file);

    fetch('/upload', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        console.log('Respuesta del servidor:', data);
       
        listarEPUBs();
      })
      .catch(error => {
        console.error('Error al subir el archivo:', error);
        alert('Error al subir el archivo.');
      });
  });

  // Leer ebook guardado en Drive
 
  function listarEPUBs() {
    listadoLibros.textContent = ""; 
  
    fetch('/listarLibros')
      .then(resp => {
        if (!resp.ok) {
          throw new Error(`Error en la respuesta: ${resp.status}`);
        }
        return resp.json();
      })
      .then(archivos => {
        archivos.forEach(a => {
          const listItem = document.createElement("li");
  
          // Enlace para ver el libro
          const link = document.createElement("a");
          link.href = `libro.html?fileId=${a.id}`;
          link.textContent = a.name;
  
       
  
          //  botón de eliminar
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Eliminar";
          deleteBtn.style.marginLeft = "15px";
          deleteBtn.addEventListener("click", () => {
            if (confirm(`¿Estás seguro de eliminar el libro ${a.name}?`)) {
              eliminarArchivo(a.id);
            }
          });
  
          // Agregar los elementos al item
          listItem.appendChild(link);
       
          listItem.appendChild(deleteBtn);
  
          listadoLibros.appendChild(listItem);
        });
      })
      .catch(error => {
        console.error('Error obteniendo lista de archivos:', error);
      });
  }
  
  async function eliminarArchivo(fileId) {
    try {
      const response = await fetch(`/eliminarLibro?fileId=${fileId}`, {
        method: 'DELETE'
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      console.log(`Archivo con ID ${fileId} eliminado exitosamente.`);
      
      //  actualizar la lista en pantalla
      listarEPUBs();
    } catch (error) {
      console.error("Error al eliminar el archivo:", error.message);
    }
  }
  



  listarEPUBs();
});
