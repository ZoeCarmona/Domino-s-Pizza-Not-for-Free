// Inizialating the map with leaflet
const map = L.map('map').setView([19.336019, -99.178197], 18);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Marker for the pizza place (it never changes)
const pizzaIcon = L.icon({
  iconUrl: 'https://cdn.pixabay.com/photo/2014/04/03/10/03/google-309739_960_720.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.marker([19.33599095885102, -99.17823258916884], { icon: pizzaIcon }).addTo(map);

// Preparing and empty marker for the user
// (it will be created when the user selects a place)
let userMarker = null;
const userIcon = L.icon({
  iconUrl: 'https://cdn.pixabay.com/photo/2014/04/03/10/03/google-309740_960_720.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Elements of the Google UI
const input           = document.getElementById('pac-input');
const typeSelectors   = {
  all:           document.getElementById('changetype-all'),
  address:       document.getElementById('changetype-address'),
  establishment: document.getElementById('changetype-establishment'),
  geocode:       document.getElementById('changetype-geocode'),
};
const biasCheckbox    = document.getElementById('use-location-bias');
const strictBoundsBox = document.getElementById('use-strict-bounds');

// Limitating the search to a specific area
function applyBoundsBias(autocomplete) {
  if (!biasCheckbox.checked) {
    autocomplete.setBounds({ east:180, west:-180, north:90, south:-90 });
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

// Callback of google that creates the Autocomplete
function initAutocomplete() {
  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ['geometry','name','formatted_address'],
    strictBounds: false
  });

  // Aplies the bias (limitations) and listeners to the controls
  applyBoundsBias(autocomplete);
  map.on('moveend',    () => applyBoundsBias(autocomplete));
  biasCheckbox.addEventListener('change', () => {
    strictBoundsBox.checked = false;
    applyBoundsBias(autocomplete);
  });
  strictBoundsBox.addEventListener('change', () => {
    autocomplete.setOptions({ strictBounds: strictBoundsBox.checked });
    if (strictBoundsBox.checked) {
      biasCheckbox.checked = true;
      applyBoundsBias(autocomplete);
    }
  });
  function setTypes(types) {
    autocomplete.setTypes(types);
    input.value = '';
  }
  typeSelectors.all.addEventListener('click',        () => setTypes([]));
  typeSelectors.address.addEventListener('click',    () => setTypes(['address']));
  typeSelectors.establishment.addEventListener('click',() => setTypes(['establishment']));
  typeSelectors.geocode.addEventListener('click',    () => setTypes(['geocode']));

  // Only listener for place_changed
  autocomplete.addListener('place_changed', async () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      return alert('No se encontró esa ubicación');
    }

    // Coordinates of the user (selected by the autocomplete)
    const lat2 = place.geometry.location.lat();
    const lng2 = place.geometry.location.lng();
    console.log('Coordenadas usuario:', lat2, lng2);

    // Petition to our Flask 
    const resp = await fetch(
      `http://127.0.0.1:5000/route?` +
      `lat1=19.33622141133345&lng1=-99.17826954663425` +
      `&lat2=${lat2}&lng2=${lng2}`
    );
    const data = await resp.json();
    if (!resp.ok) return alert(data.error);

    // Drawing the route, it will be removed if it exists
    if (window.routeLine) map.removeLayer(window.routeLine);
    window.routeLine = L.polyline(data.coords, {
      color: 'blue', weight: 4
    }).addTo(map);

    // Creates or moves the red marker
    if (userMarker) userMarker.setLatLng([lat2, lng2]);
    else userMarker = L.marker([lat2, lng2], { icon: userIcon }).addTo(map);

    // Pop up with estimated time
    userMarker.bindPopup(`⏱️ Time: ${data.time_min} min`).openPopup();

    // Ajusting the view to the bounds of the route
    map.fitBounds(window.routeLine.getBounds(), { padding: [50, 50] });
  });
}

// We make it global so Google can call it
window.initAutocomplete = initAutocomplete;
