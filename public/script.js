document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    if (page === 'ferienwohnungen') {
        loadFerienwohnungenFromDB();
        initializeMaps();
    }
});

async function loadFerienwohnungenFromDB() {
    try {
        const response = await fetch('/api/ferienwohnungen');
        const ferienwohnungen = await response.json();
        const container = document.getElementById('ferienwohnungen-container');
        container.innerHTML = '';

        ferienwohnungen.forEach(wohnung => {
            const card = `
                <div class="col-md-4">
                    <a href="buchung.html?id=${wohnung._id}" class="text-decoration-none">
                        <div class="card mb-4">
                            <div class="img-container">
                                <img src="${wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png'}" class="card-img-top" alt="${wohnung.name}">
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${wohnung.name}</h5>
                                <p class="card-text">${wohnung.beschreibung}</p>
                                <p class="card-text"><strong>Ort:</strong> ${wohnung.ort}</p>
                                <a href="buchung.html?id=${wohnung._id}" class="btn btn-primary w-100 mt-3">Jetzt buchen</a>
                                <div id="map${wohnung._id}" style="height: 200px; width: 100%;"></div>
                            </div>
                        </div>
                    </a>
                </div>
            `;
            container.innerHTML += card;
        });

        // Initialize maps for each apartment
        initMapsFerienwohnungen(ferienwohnungen);

    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

// Initialize the map for each apartment
function initMapsFerienwohnungen(ferienwohnungen) {
    ferienwohnungen.forEach(wohnung => {
        const mapContainer = document.getElementById(`map${wohnung._id}`);
        if (mapContainer && wohnung.lat && wohnung.lng) {
            const map = new google.maps.Map(mapContainer, {
                center: { lat: parseFloat(wohnung.lat), lng: parseFloat(wohnung.lng) },
                zoom: 12
            });
            new google.maps.Marker({
                position: { lat: parseFloat(wohnung.lat), lng: parseFloat(wohnung.lng) },
                map: map,
                title: wohnung.name
            });
        }
    });
}

// Fetch the Google Maps API key and load the script
fetch('/api/google-maps-key')
    .then(response => response.json())
    .then(data => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=initializeMaps`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    })
    .catch(error => console.error('Error fetching Google Maps API Key:', error));

function initializeMaps() {
    if (typeof initMapsFerienwohnungen === 'function') {
        console.log("Google Maps API loaded and initializing maps.");
    } else {
        console.error('initMapsFerienwohnungen function not found.');
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    // Initialize page-specific functionality
    switch (page) {
        case 'ferienwohnungen':
            loadFerienwohnungenFromDB();
            initializeSearchFunctionality();
            initializeMaps();
            break;
        case 'buchung':
            loadFerienwohnungenForBooking();
            handlePreselectedApartment();
            setMinDateForBooking();
            document.getElementById('wohnungDropdown').addEventListener('change', (event) => {
                updateWohnungDetails(event.target.value);
            });
            break;
        case 'inserate-bearbeiten':
            loadInserateVerwaltung();
            break;
    }
});

// Load apartments for the booking page
async function loadFerienwohnungenForBooking() {
    try {
        const response = await fetch('/api/ferienwohnungen');
        const ferienwohnungen = await response.json();
        const wohnungDropdown = document.getElementById('wohnungDropdown');
        wohnungDropdown.innerHTML = `<option value="" selected>Bitte wählen...</option>`;

        ferienwohnungen.forEach(wohnung => {
            const option = document.createElement('option');
            option.value = wohnung._id;
            option.textContent = `${wohnung.name} (${wohnung.ort})`;
            wohnungDropdown.appendChild(option);
        });

        handlePreselectedApartment(); // Ensure preselected apartment is handled after loading
    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

// Initialize search functionality on the apartment page
function initializeSearchFunctionality() {
    document.getElementById('searchInput').addEventListener('input', async function() {
        const searchValue = this.value.toLowerCase();
        try {
            const response = await fetch('/api/ferienwohnungen');
            const ferienwohnungen = await response.json();
            const filteredWohnungen = ferienwohnungen.filter(wohnung =>
                wohnung.ort.toLowerCase().includes(searchValue)
            );
            displayFilteredWohnungen(filteredWohnungen);
        } catch (error) {
            console.error('Fehler beim Laden der Ferienwohnungen:', error);
        }
    });
} 

// Display filtered apartments based on the search input
function displayFilteredWohnungen(filteredWohnungen) {
    const container = document.getElementById('ferienwohnungen-container');
    container.innerHTML = '';

    if (filteredWohnungen.length === 0) {
        container.innerHTML = `<p>Keine Ferienwohnungen gefunden.</p>`;
    } else {
        filteredWohnungen.forEach(wohnung => {
            const card = `
                <a href="buchung.html?id=${wohnung._id}" class="text-decoration-none text-dark">
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="img-container">
                                <img src="/${wohnung.bild}" class="card-img-top" alt="${wohnung.name}">
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${wohnung.name}</h5>
                                <p class="card-text">${wohnung.beschreibung}</p>
                                <p class="card-text"><strong>Ort:</strong> ${wohnung.ort}</p>
                                <div id="map${wohnung._id}" style="height: 200px; width: 100%;"></div>
                            </div>
                        </div>
                    </div>
                </a>
            `;
            container.innerHTML += card;
        });

        initMapsFerienwohnungen(filteredWohnungen);
    }
}

// Initialize the map for the selected apartment on the booking page
function initMapBuchung(wohnung) {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer && wohnung.lat && wohnung.lng) {
        mapContainer.style.display = 'block';

        const map = new google.maps.Map(mapContainer, {
            center: { lat: wohnung.lat, lng: wohnung.lng },
            zoom: 12
        });

        new google.maps.Marker({
            position: { lat: wohnung.lat, lng: wohnung.lng },
            map: map
        });
    }
}

// Handle preselection of apartment for the booking form
function handlePreselectedApartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedWohnungId = urlParams.get('id');
    if (selectedWohnungId) {
        const wohnungDropdown = document.getElementById('wohnungDropdown');

        // Wait until apartments are loaded into the dropdown
        setTimeout(() => {
            wohnungDropdown.value = selectedWohnungId;
            updateWohnungDetails(selectedWohnungId);
        }, 500); // Slight delay to ensure dropdown is populated
    }
}

// Update the selected apartment details on the booking page
function updateWohnungDetails(wohnungId) {
    fetch(`/api/ferienwohnungen/${wohnungId}`)
    .then(response => response.json())
    .then(wohnung => {
        const wohnungDetails = document.getElementById('wohnungDetails');
        wohnungDetails.innerHTML = `
            <img src="/${wohnung.bild}" class="img-fluid mb-3 small-image" alt="${wohnung.name}">
            <p><strong>Ort:</strong> ${wohnung.ort}</p>
            <p>${wohnung.beschreibung}</p>
        `;
        
        const wohnungBilder = document.getElementById('wohnungBilder');
        wohnungBilder.innerHTML = '';  // Clear any previous images
        if (wohnung.bilder && wohnung.bilder.length > 0) {
            wohnung.bilder.forEach(bild => {
                const imgElement = document.createElement('img');
                imgElement.src = `/${bild}`;
                imgElement.className = 'img-fluid small-image';
                wohnungBilder.appendChild(imgElement);
            });
        }
    })
    .catch(error => console.error('Fehler beim Laden der Ferienwohnung:', error));
}

// Admin functionality: Load and manage listings (with authentication)
async function loadInserateVerwaltung() {
    try {
        const response = await fetch('/api/ferienwohnungen', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        const ferienwohnungen = await response.json();
        const inserateContainer = document.getElementById('inserate-container');
        inserateContainer.innerHTML = '';

        ferienwohnungen.forEach(wohnung => {
            const card = `
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="img-container">
                            <img src="/${wohnung.bild}" class="card-img-top" alt="${wohnung.name}">
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${wohnung.name}</h5>
                            <p class="card-text">${wohnung.beschreibung}</p>
                            <p class="card-text"><strong>Ort:</strong> ${wohnung.ort}</p>
                            <button class="btn btn-danger" onclick="deleteInserat('${wohnung._id}')">Löschen</button>
                            <button class="btn btn-warning" onclick="editInserat('${wohnung._id}')">Bearbeiten</button>
                        </div>
                    </div>
                </div>
            `;
            inserateContainer.innerHTML += card;
        });
    } catch (error) {
        console.error('Fehler beim Laden der Inserate:', error);
    }
}

// Delete listing function
window.deleteInserat = async function(id) {
    try {
        const response = await fetch(`/api/ferienwohnungen/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        if (response.ok) {
            alert('Inserat gelöscht');
            loadInserateVerwaltung();
        } else {
            throw new Error('Fehler beim Löschen des Inserats');
        }
    } catch (error) {
        console.error('Fehler beim Löschen des Inserats:', error);
    }
}

// Placeholder function for editing listing
window.editInserat = function(id) {
    alert(`Inserat ${id} bearbeiten`);
}

// Handle authentication and navigation visibility
document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const profileLink = document.getElementById('profileLink');
    const adminNav = document.getElementById('adminNav');

    if (authToken) {
        loginNav.style.display = 'none';
        logoutNav.style.display = 'block';
        profileLink.style.display = 'block';

        if (userRole === 'admin') {
            adminNav.style.display = 'block';
        }
    } else {
        loginNav.style.display = 'block';
        logoutNav.style.display = 'none';
        profileLink.style.display = 'none';
        adminNav.style.display = 'none';
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
        });
    }
});

// Add and submit new listing
document.addEventListener('DOMContentLoaded', () => {
    const inseratForm = document.getElementById('inseratForm');

    if (inseratForm) {
        inseratForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const formData = new FormData(inseratForm);

            try {
                const response = await fetch('/api/ferienwohnungen', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: formData
                });
                if (response.ok) {
                    alert('Ferienwohnung erfolgreich hinzugefügt');
                    inseratForm.reset();
                    loadInserateVerwaltung();
                } else {
                    const errorData = await response.json();
                    throw new Error(`Fehler beim Hinzufügen der Ferienwohnung: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Fehler:', error);
                alert(`Fehler: ${error.message}`);
            }
        });
    }
});
