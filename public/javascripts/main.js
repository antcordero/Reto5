let visorMapa;
let marcadorUsuario;
let marcadorVehiculo;
let seguimientoId;
let posicionActual = null;

const btnGuardar = document.getElementById('btn-aparcar');
const btnLibertar = document.getElementById('btn-retirar');
const panelEstado = document.getElementById('info-panel');
const spanDistancia = document.getElementById('distancia');
const spanTiempo = document.getElementById('tiempo');

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('map')) {
        inicializarMapa();
        verificarEstado();
        activarSeguimiento();

        btnGuardar.addEventListener('click', registrarAparcamiento);
        btnLibertar.addEventListener('click', liberarAparcamiento);
    }
});

function inicializarMapa() {
    visorMapa = L.map('map').setView([40.4168, -3.7038], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(visorMapa);
}

function activarSeguimiento() {
    if (!('geolocation' in navigator)) {
        alert('Tu navegador no soporta geolocalización.');
        return;
    }

    seguimientoId = navigator.geolocation.watchPosition(
        ({ coords }) => {
            posicionActual = { lat: coords.latitude, lng: coords.longitude };

            if (!marcadorUsuario) {
                marcadorUsuario = L.marker([coords.latitude, coords.longitude])
                    .addTo(visorMapa)
                    .bindPopup('Tu posición actual');
                visorMapa.setView([coords.latitude, coords.longitude], 16);
            } else {
                marcadorUsuario.setLatLng([coords.latitude, coords.longitude]);
            }

            refrescarMetricas();
        },
        (err) => console.error('Error de geolocalización:', err.message),
        { enableHighAccuracy: true, maximumAge: 0 }
    );
}

async function registrarAparcamiento() {
    if (!posicionActual) {
        alert('Esperando ubicación GPS. Inténtalo en un momento.');
        return;
    }

    const registro = {
        lat: posicionActual.lat,
        lng: posicionActual.lng,
        timestamp: Date.now()
    };

    localStorage.setItem('aparcamiento_actual', JSON.stringify(registro));

    try {
        const respuesta = await fetch('/api/aparcamientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });

        const datos = await respuesta.json();

        if (datos.success && datos.insertId) {
            registro.remoteId = datos.insertId;
            localStorage.setItem('aparcamiento_actual', JSON.stringify(registro));
        }
    } catch (err) {
        console.log('Sin conexión al servidor, modo local activo:', err);
    }

    verificarEstado();
}

function liberarAparcamiento() {
    const registroActual = JSON.parse(localStorage.getItem('aparcamiento_actual'));
    const historial = JSON.parse(localStorage.getItem('historial_aparcamientos')) || [];

    registroActual.fechaFin = Date.now();
    historial.push(registroActual);

    localStorage.setItem('historial_aparcamientos', JSON.stringify(historial));
    localStorage.removeItem('aparcamiento_actual');

    verificarEstado();
}

function verificarEstado() {
    const guardado = localStorage.getItem('aparcamiento_actual');

    if (guardado) {
        const datos = JSON.parse(guardado);

        if (!marcadorVehiculo) {
            const iconoCoche = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            marcadorVehiculo = L.marker([datos.lat, datos.lng], { icon: iconoCoche })
                .addTo(visorMapa)
                .bindPopup('Tu vehículo');
        } else {
            marcadorVehiculo.setLatLng([datos.lat, datos.lng]);
        }

        btnGuardar.classList.add('d-none');
        btnLibertar.classList.remove('d-none');
        panelEstado.classList.remove('d-none');

        refrescarMetricas();

        if (marcadorUsuario) {
            const grupo = new L.featureGroup([marcadorUsuario, marcadorVehiculo]);
            visorMapa.fitBounds(grupo.getBounds(), { padding: [50, 50] });
        }

    } else {
        if (marcadorVehiculo) {
            visorMapa.removeLayer(marcadorVehiculo);
            marcadorVehiculo = null;
        }
        btnGuardar.classList.remove('d-none');
        btnLibertar.classList.add('d-none');
        panelEstado.classList.add('d-none');
    }
}

function refrescarMetricas() {
    const guardado = localStorage.getItem('aparcamiento_actual');
    if (!guardado || !posicionActual) return;

    const datos = JSON.parse(guardado);
    const metros = calcularMetros(posicionActual.lat, posicionActual.lng, datos.lat, datos.lng);
    spanDistancia.textContent = metros.toFixed(0);

    const minutos = Math.floor((Date.now() - datos.timestamp) / 60000);
    spanTiempo.textContent = minutos;
}

function calcularMetros(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const φ1 = lat1 * rad;
    const φ2 = lat2 * rad;
    const Δφ = (lat2 - lat1) * rad;
    const Δλ = (lon2 - lon1) * rad;

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
