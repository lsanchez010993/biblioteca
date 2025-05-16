document.addEventListener('DOMContentLoaded', () => {
   
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const numeroPaginaDisplay = document.getElementById('numeroPagina'); // Elemento para mostrar el número de página

    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('fileId');
    if (!fileId) {
        alert('No se proporcionó el fileId del libro.');
        return;
    }

    const epubUrl = `/leerEPUB?fileId=${fileId}`;
    let book, rendition;

    fetch(epubUrl)
        .then(resp => resp.blob())
        .then(blob => {
            book = ePub(blob);
            rendition = book.renderTo("viewer", {
                width: "100%",
                height: "100%"
            });

            book.ready.then(() => {
                book.locations.generate(1000).then(() => {
                    // Obtener la última ubicación guardada en LocalStorage
                    const lastLocation = localStorage.getItem(`epub_location_${fileId}`);

                    if (lastLocation) {
                        rendition.display(lastLocation);
                    } else {
                        rendition.display();
                    }

                    // Evento para actualizar el número de página y guardar la ubicación en LocalStorage
                    rendition.on("relocated", (location) => {
                        const currentPage = book.locations.locationFromCfi(location.start.cfi);
                        const totalPages = book.locations.total;
                        numeroPaginaDisplay.textContent = `Página ${currentPage} de ${totalPages}`;

                        // Guardar la última ubicación en LocalStorage
                        localStorage.setItem(`epub_location_${fileId}`, location.start.cfi);
                    });
                });
            });

            prevBtn.addEventListener("click", () => {
                rendition.prev();
            });

            nextBtn.addEventListener("click", () => {
                rendition.next();
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === "ArrowRight") {
                    rendition.next();
                } else if (event.key === "ArrowLeft") {
                    rendition.prev();
                }
            });
        })
        .catch(error => {
            console.error("Error cargando el EPUB:", error);
        });

    document.getElementById('volverIndex').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
