document.addEventListener('DOMContentLoaded', () => {
    mostrarHistorialGuardado();
});

function mostrarHistorialGuardado() {
    const datos = localStorage.getItem('historial_aparcamientos');
    const tabla = document.getElementById('tabla-historial');
    const avisoVacio = document.getElementById('no-data');
    const cuerpoTabla = document.getElementById('historial-body');

    const registros = datos ? JSON.parse(datos) : [];

    if (registros.length === 0) {
        tabla.classList.add('d-none');
        avisoVacio.classList.remove('d-none');
        return;
    }

    [...registros].reverse().forEach(registro => {
        const fila = document.createElement('tr');

        const inicio = new Date(registro.timestamp).toLocaleString('es-ES');
        const fin = registro.fechaFin
            ? new Date(registro.fechaFin).toLocaleString('es-ES')
            : 'En curso';

        fila.innerHTML = `
            <td>${inicio}</td>
            <td>${fin}</td>
            <td>
                <a href="https://www.google.com/maps/search/?api=1&query=${registro.lat},${registro.lng}"
                   target="_blank" class="btn btn-sm btn-outline-primary">
                    Ver ubicación
                </a>
            </td>
        `;

        cuerpoTabla.appendChild(fila);
    });
}
