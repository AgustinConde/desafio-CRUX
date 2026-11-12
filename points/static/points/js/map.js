const defaultCenter = [-34.6037, -58.3816];
const mapElement = document.querySelector("#map");

if (mapElement) {
    const map = L.map(mapElement).setView(defaultCenter, 12);

    const primaryLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/" +
            "World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Sources: Esri, " +
                "TomTom, Garmin, FAO, NOAA, USGS, " +
                "&copy; OpenStreetMap contributors",
            maxZoom: 20,
            keepBuffer: 0,
            updateWhenIdle: true,
            updateWhenZooming: false,
        },
    ).addTo(map);

    let fallbackEnabled = false;
    primaryLayer.on("tileerror", () => {
        if (fallbackEnabled) {
            return;
        }

        fallbackEnabled = true;
        map.removeLayer(primaryLayer);
        L.tileLayer(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">' +
                    'OpenStreetMap contributors</a>',
                maxZoom: 19,
                keepBuffer: 0,
                updateWhenIdle: true,
                updateWhenZooming: false,
            },
        ).addTo(map);
    });

    map.on("click", (event) => {
        const params = new URLSearchParams({
            lat: event.latlng.lat.toFixed(6),
            lng: event.latlng.lng.toFixed(6),
        });
        window.location.href = `/points/new/?${params.toString()}`;
    });

    fetch("/api/points/")
        .then((response) => {
            if (!response.ok) {
                throw new Error("No se pudieron cargar los puntos.");
            }
            return response.json();
        })
        .then(({ points }) => {
            const bounds = [];

            points.forEach((point) => {
                const coordinates = [point.latitude, point.longitude];
                const marker = L.circleMarker(coordinates, {
                    color: point.status === "active" ? "#198754" : "#6c757d",
                    fillColor: point.status === "active" ? "#198754" : "#6c757d",
                    fillOpacity: 0.8,
                    radius: 8,
                }).addTo(map);

                const popup = document.createElement("div");
                const name = document.createElement("strong");
                const description = document.createElement("p");
                name.textContent = point.name;
                description.textContent = point.description || "Sin descripción.";
                popup.append(name, description);
                marker.bindPopup(popup);
                bounds.push(coordinates);
            });

            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [24, 24] });
            }
        })
        .catch((error) => {
            console.error(error);
        });
}
