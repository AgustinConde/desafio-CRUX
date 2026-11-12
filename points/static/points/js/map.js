const defaultCenter = [-34.6037, -58.3816];
const mapElement = document.querySelector("#map");
const modal = document.querySelector("#point-modal");
const pointForm = document.querySelector("#point-form");
const deleteModal = document.querySelector("#delete-modal");
const deleteForm = document.querySelector("#delete-form");
const pointData = new Map();
const markers = new Map();
const mapStateKey = "points-map-state";
const worldBounds = [
    [-85.051129, -180],
    [85.051129, 180],
];

function clearFieldError(field) {
    field.classList.remove("field-invalid");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    document.querySelector(`#${field.id}-error`).hidden = true;
}

function setFieldError(field, message) {
    const error = document.querySelector(`#${field.id}-error`);
    field.classList.add("field-invalid");
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", error.id);
    error.textContent = message;
    error.hidden = false;
}

function clearFormErrors() {
    ["#point-name", "#point-latitude", "#point-longitude"].forEach((selector) => {
        clearFieldError(document.querySelector(selector));
    });
}

function validatePointForm() {
    const name = document.querySelector("#point-name");
    const latitude = document.querySelector("#point-latitude");
    const longitude = document.querySelector("#point-longitude");
    let firstInvalidField = null;

    clearFormErrors();

    if (!name.value.trim()) {
        setFieldError(name, "Ingresá un nombre para el punto.");
        firstInvalidField = name;
    }

    const coordinates = [
        { field: latitude, min: -90, max: 90, label: "La latitud" },
        { field: longitude, min: -180, max: 180, label: "La longitud" },
    ];

    coordinates.forEach(({ field, min, max, label }) => {
        const value = Number(field.value);
        if (!field.value || !Number.isFinite(value)) {
            setFieldError(field, `${label} es obligatoria.`);
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else if (value < min || value > max) {
            setFieldError(
                field,
                `${label} debe estar entre ${min} y ${max}.`,
            );
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        }
    });

    if (firstInvalidField) {
        firstInvalidField.focus();
        return false;
    }

    return true;
}

function openPointModal(point, coordinates) {
    const isEditing = Boolean(point);
    clearFormErrors();
    document.querySelector("#modal-title").textContent = isEditing
        ? "Editar punto"
        : "Nuevo punto";
    document.querySelector("#point-id").value = isEditing ? point.id : "";
    document.querySelector("#point-name").value = isEditing ? point.name : "";
    document.querySelector("#point-description").value = isEditing
        ? point.description
        : "";
    document.querySelector("#point-latitude").value = isEditing
        ? point.latitude
        : coordinates[0].toFixed(6);
    document.querySelector("#point-longitude").value = isEditing
        ? point.longitude
        : coordinates[1].toFixed(6);
    document.querySelector("#point-status").value = isEditing
        ? point.status
        : "active";
    pointForm.action = isEditing
        ? `/points/${point.id}/edit/`
        : "/points/new/";
    modal.showModal();
    document.querySelector("#point-name").focus();
}

function closePointModal() {
    modal.close();
}

function openDeleteModal(link) {
    deleteForm.action = link.href;
    document.querySelector("#delete-point-name").textContent =
        `"${link.dataset.pointName}"`;
    deleteModal.showModal();
}

function closeDeleteModal() {
    deleteModal.close();
}

function saveMapState(map) {
    const center = map.getCenter();
    localStorage.setItem(mapStateKey, JSON.stringify({
        latitude: center.lat,
        longitude: center.lng,
        zoom: map.getZoom(),
    }));
}

function restoreMapState(map) {
    const savedState = localStorage.getItem(mapStateKey);
    if (!savedState) {
        return false;
    }

    try {
        const state = JSON.parse(savedState);
        const latitude = Number(state.latitude);
        const longitude = Number(state.longitude);
        const zoom = Number(state.zoom);
        const isValidState =
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            Number.isFinite(zoom) &&
            latitude >= worldBounds[0][0] &&
            latitude <= worldBounds[1][0] &&
            longitude >= worldBounds[0][1] &&
            longitude <= worldBounds[1][1] &&
            zoom >= 2.2 &&
            zoom <= 18;

        if (!isValidState) {
            localStorage.removeItem(mapStateKey);
            return false;
        }

        map.setView([latitude, longitude], zoom);
        return true;
    } catch (error) {
        localStorage.removeItem(mapStateKey);
        console.error("No se pudo restaurar la posición del mapa.", error);
        return false;
    }
}

function filterPoints() {
    const search = document.querySelector("#point-search").value.toLowerCase();
    const status = document.querySelector("#status-filter").value;
    let visibleRows = 0;

    document.querySelectorAll("tbody tr").forEach((row) => {
        const matchesSearch = row.dataset.search.toLowerCase().includes(search);
        const matchesStatus = !status || row.dataset.status === status;
        const isVisible = matchesSearch && matchesStatus;
        row.hidden = !isVisible;
        visibleRows += isVisible ? 1 : 0;
    });

    document.querySelector("#empty-state").hidden = visibleRows > 0;
}

if (mapElement) {
    const map = L.map(mapElement, {
        maxBounds: worldBounds,
        maxBoundsViscosity: 1,
        maxZoom: 18,
        minZoom: 2.2,
        zoomDelta: 0.5,
        zoomSnap: 0.5,
        worldCopyJump: false,
    }).setView(defaultCenter, 12);

    const primaryLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/" +
            "World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Sources: Esri, " +
                "TomTom, Garmin, FAO, NOAA, USGS, " +
                "&copy; OpenStreetMap contributors",
            keepBuffer: 0,
            maxZoom: 20,
            noWrap: true,
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
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">' +
                "OpenStreetMap contributors</a>",
            keepBuffer: 0,
            maxZoom: 19,
            noWrap: true,
            updateWhenIdle: true,
            updateWhenZooming: false,
        }).addTo(map);
    });

    map.on("moveend", () => saveMapState(map));
    map.on("click", (event) => {
        const { lat, lng } = event.latlng;
        if (
            lat < worldBounds[0][0] ||
            lat > worldBounds[1][0] ||
            lng < worldBounds[0][1] ||
            lng > worldBounds[1][1]
        ) {
            return;
        }
        openPointModal(null, [event.latlng.lat, event.latlng.lng]);
    });

    document.querySelector("#new-point-button").addEventListener("click", () => {
        const center = map.getCenter();
        openPointModal(null, [center.lat, center.lng]);
    });

    document.querySelector("#close-modal").addEventListener("click", closePointModal);
    document.querySelector("#cancel-modal").addEventListener("click", closePointModal);
    document.querySelector("#close-delete-modal").addEventListener("click", closeDeleteModal);
    document.querySelector("#cancel-delete-modal").addEventListener("click", closeDeleteModal);
    document.querySelector("#point-search").addEventListener("input", filterPoints);
    document.querySelector("#status-filter").addEventListener("change", filterPoints);

    ["#point-name", "#point-latitude", "#point-longitude"].forEach((selector) => {
        document.querySelector(selector).addEventListener("input", (event) => {
            clearFieldError(event.target);
        });
    });

    pointForm.addEventListener("submit", (event) => {
        if (!validatePointForm()) {
            event.preventDefault();
            return;
        }
        document.querySelector("#point-latitude").value = Number(
            document.querySelector("#point-latitude").value,
        ).toFixed(6);
        document.querySelector("#point-longitude").value = Number(
            document.querySelector("#point-longitude").value,
        ).toFixed(6);
        saveMapState(map);
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
                pointData.set(String(point.id), point);
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
                markers.set(String(point.id), marker);
                bounds.push(coordinates);
            });

            if (!restoreMapState(map) && bounds.length > 0) {
                map.fitBounds(bounds, { padding: [24, 24] });
            }

            document.querySelectorAll(".edit-point").forEach((button) => {
                button.addEventListener("click", () => {
                    openPointModal(pointData.get(button.closest("tr").dataset.pointId));
                });
            });

            document.querySelectorAll(".go-point").forEach((button) => {
                button.addEventListener("click", () => {
                    const point = pointData.get(button.closest("tr").dataset.pointId);
                    map.setView([point.latitude, point.longitude], 16);
                    markers.get(String(point.id)).openPopup();
                });
            });

            document.querySelectorAll(".icon-action--danger").forEach((link) => {
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    openDeleteModal(link);
                });
            });

            filterPoints();
        })
        .catch((error) => {
            console.error(error);
        });
}
