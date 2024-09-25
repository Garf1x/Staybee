document.addEventListener('DOMContentLoaded', () => {
    const ferienwohnungen = [
        {
            id: 1,
            name: 'Ferienwohnung am Strand',
            ort: 'Hamburg',
            beschreibung: 'Eine wunderschöne Wohnung direkt am Meer.',
            bild: 'img/beach-apartment.jpeg',
            lat: 53.5511,
            lng: 9.9937
        },
        {
            id: 2,
            name: 'Bergblick Ferienwohnung',
            ort: 'Garmisch-Partenkirchen',
            beschreibung: 'Genießen Sie die atemberaubende Aussicht auf die Berge.',
            bild: 'img/mountain-cabin.jpeg',
            lat: 47.4979,
            lng: 11.3546
        },
        {
            id: 3,
            name: 'Stadthaus im Zentrum',
            ort: 'Berlin',
            beschreibung: 'Perfekte Lage für Städtereisen.',
            bild: 'img/city-house.jpeg',
            lat: 52.5200,
            lng: 13.4050
        }
    ];

    // Populate the dropdown with apartment options
    function populateDropdown() {
        const wohnungDropdown = document.getElementById('wohnungDropdown');
        ferienwohnungen.forEach(wohnung => {
            const option = document.createElement('option');
            option.value = wohnung.id;
            option.textContent = `${wohnung.name} (${wohnung.ort})`;
            wohnungDropdown.appendChild(option);
        });
    }

    // Update the details and map when an apartment is selected
    function updateWohnungDetails() {
        const wohnungId = document.getElementById('wohnungDropdown').value;
        const wohnung = ferienwohnungen.find(w => w.id == wohnungId);
        if (wohnung) {
            displayWohnungDetails(wohnung);
            initMap(wohnung);
        }
    }

    // Display selected apartment details
    function displayWohnungDetails(wohnung) {
        document.getElementById('wohnungDetails').innerHTML = `
            <img src="${wohnung.bild}" class="img-fluid mb-3" alt="${wohnung.name}">
            <p><strong>Ort:</strong> ${wohnung.ort}</p>
            <p>${wohnung.beschreibung}</p>
        `;
    }

    // Initialize map for the selected apartment
    function initMap(wohnung) {
        const mapContainer = document.createElement('div');
        mapContainer.id = `map${wohnung.id}`;
        mapContainer.style.height = '300px';
        document.getElementById('wohnungDetails').appendChild(mapContainer);

        const map = L.map(mapContainer.id).setView([wohnung.lat, wohnung.lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker([wohnung.lat, wohnung.lng]).addTo(map);
    }

    // Attach the update function to the dropdown change event
    document.getElementById('wohnungDropdown').addEventListener('change', updateWohnungDetails);

    // Populate the dropdown on page load
    populateDropdown();
});
