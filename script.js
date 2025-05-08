// This script initializes a Leaflet map located near our Domino´s Pizza store in Mexico City.
let store = L.map('map').setView([19.336019, -99.178197], 18)

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(store);

// Adding a marker for the store location
let storeMarker = L.marker([19.33599095885102, -99.17823258916884]).addTo(store)

let routeLayer, customerMarker;

    document.getElementById('go').onclick = async () => {
        const addr = document.getElementById('address').value;
      // 2) Geocodifica en el front con Mapbox
        const geo = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=TU_MAPBOX_TOKEN&limit=1`);
        const gj = await geo.json();
        const [lng, lat] = gj.features[0].geometry.coordinates;

        // Muestra un marcador para el cliente
        if (customerMarker) map.removeLayer(customerMarker);
        customerMarker = L.marker([lat, lng]).addTo(map).bindPopup('Cliente').openPopup();

        // 3) Pide la ruta a tu backend Flask
        const res = await fetch('/route', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ lat, lng })
        });
        const data = await res.json();

        // 4) Dibuja la ruta si es entregable
        if (routeLayer) map.removeLayer(routeLayer);
        if (data.deliverable) {
            routeLayer = L.geoJSON(data.route, { style: { color: 'red', weight: 4 }})
            .addTo(map);
            map.fitBounds(routeLayer.getBounds());
        } else {
            alert(data.reason);
        }
    };