// 1) Inicializa tu mapa Leaflet
const map = L.map('map').setView([19.336019, -99.178197], 18);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 2) Marcador original (pizzería) — nunca cambie
const pizzaIcon = L.icon({
  iconUrl: 'https://cdn.pixabay.com/photo/2014/04/03/10/03/google-309739_960_720.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const pizzaMarker = L.marker(
  [19.33599095885102, -99.17823258916884],
  { icon: pizzaIcon }
).addTo(map);

// 3) Preparar un marcador “usuario” vacío
let userMarker = null;
const userIcon = L.icon({
  iconUrl: 'https://cdn.pixabay.com/photo/2014/04/03/10/03/google-309740_960_720.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// 4) Elementos de la UI de Google
const input           = document.getElementById('pac-input');
const typeSelectors   = {
  all:           document.getElementById('changetype-all'),
  address:       document.getElementById('changetype-address'),
  establishment: document.getElementById('changetype-establishment'),
  geocode:       document.getElementById('changetype-geocode'),
};
const biasCheckbox    = document.getElementById('use-location-bias');
const strictBoundsBox = document.getElementById('use-strict-bounds');

// 5) Callback de Google que crea el Autocomplete
function initAutocomplete() {
  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ['geometry', 'name', 'formatted_address'],
    strictBounds: false
  });

  // Sesgar por viewport Leaflet
  function applyBoundsBias() {
    if (!biasCheckbox.checked) {
      // Todo el mundo
      autocomplete.setBounds({
        east: 180, west: -180, north: 90, south: -90
      });
      return;
    }
    const b  = map.getBounds();
    const sw = b.getSouthWest(), ne = b.getNorthEast();
    const gBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(sw.lat, sw.lng),
      new google.maps.LatLng(ne.lat, ne.lng)
    );
    autocomplete.setBounds(gBounds);
  }

  map.on('moveend', applyBoundsBias);
  biasCheckbox.addEventListener('change', () => {
    strictBoundsBox.checked = false;
    applyBoundsBias();
  });
  strictBoundsBox.addEventListener('change', () => {
    autocomplete.setOptions({ strictBounds: strictBoundsBox.checked });
    if (strictBoundsBox.checked) {
      biasCheckbox.checked = true;
      applyBoundsBias();
    }
  });

  // Filtros por tipo
  function setTypes(types) {
    autocomplete.setTypes(types);
    input.value = '';
  }
  typeSelectors.all.addEventListener('click',        () => setTypes([]));
  typeSelectors.address.addEventListener('click',    () => setTypes(['address']));
  typeSelectors.establishment.addEventListener('click',() => setTypes(['establishment']));
  typeSelectors.geocode.addEventListener('click',    () => setTypes(['geocode']));

  // 6) Al elegir un lugar…
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      alert('No se encontró esa ubicación');
      return;
    }

    // Extraemos coordenadas
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    console.log('Coordenadas usuario:', lat, lng);
    // Aquí podrías guardarlas en una variable, enviarlas a tu backend, etc.

    // 7) Si ya existe un marker de usuario, lo movemos; si no, lo creamos
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      userMarker = L.marker([lat, lng], { icon: userIcon })
                    .addTo(map);
    }

    // 8) Centramos el mapa sobre la nueva ubicación (opcional)
    map.setView([lat, lng], 16);
  });

  // Inicializa bias
  applyBoundsBias();
}

// Hacemos global para que Google invoque
window.initAutocomplete = initAutocomplete;
