document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    // Initialize page-specific functionality
    if (page === 'ferienwohnungen') {
        loadFerienwohnungenFromDB();  // Load apartments from the database
        initializeSearchFunctionality();
    } else if (page === 'buchung') {
        loadFerienwohnungenForBooking();  // Load apartments for booking
        handlePreselectedApartment();
        setMinDateForBooking();
        document.getElementById('wohnungDropdown').addEventListener('change', function() {
            const wohnungId = this.value;
            updateWohnungDetails(wohnungId);
        });
    } else if (page === 'inserate-bearbeiten') {
        loadInserateVerwaltung();  // Load listings for admins
    }
});

// Load apartments from the database and display them on the apartment page
function loadFerienwohnungenFromDB() {
    fetch('/api/ferienwohnungen')
        .then(response => response.json())
        .then(ferienwohnungen => {
            const container = document.getElementById('ferienwohnungen-container');
            container.innerHTML = '';

            ferienwohnungen.forEach(wohnung => {
                const card = `
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="img-container">
                                <img src="${wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png'}" class="card-img-top" alt="${wohnung.name}">
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${wohnung.name}</h5>
                                <p class="card-text">${wohnung.beschreibung}</p>
                                <p class="card-text"><strong>Ort:</strong> ${wohnung.ort}</p>
                                <div id="map${wohnung._id}" style="height: 200px; width: 100%;"></div>
                                <a href="buchung.html?id=${wohnung._id}" class="btn btn-primary w-100 mt-3">Jetzt buchen</a>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += card;
            });

            // Initialize maps for apartments
            initMapsFerienwohnungen(ferienwohnungen);
        })
        .catch(error => console.error('Fehler beim Laden der Ferienwohnungen:', error));
}


// Load apartments for the booking page
function loadFerienwohnungenForBooking() {
    fetch('/api/ferienwohnungen')
    .then(response => response.json())
    .then(ferienwohnungen => {
        const wohnungDropdown = document.getElementById('wohnungDropdown');
        wohnungDropdown.innerHTML = `<option value="" selected>Bitte wählen...</option>`; // Reset dropdown

        ferienwohnungen.forEach(wohnung => {
            const option = document.createElement('option');
            option.value = wohnung._id;
            option.textContent = `${wohnung.name} (${wohnung.ort})`;
            wohnungDropdown.appendChild(option);
        });
    })
    .catch(error => console.error('Fehler beim Laden der Ferienwohnungen:', error));
}

// Initialize search functionality on the apartment page
function initializeSearchFunctionality() {
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchValue = this.value.toLowerCase();
        fetch('/api/ferienwohnungen')
        .then(response => response.json())
        .then(ferienwohnungen => {
            const filteredWohnungen = ferienwohnungen.filter(wohnung =>
                wohnung.ort.toLowerCase().includes(searchValue)
            );
            displayFilteredWohnungen(filteredWohnungen);
        })
        .catch(error => console.error('Fehler beim Laden der Ferienwohnungen:', error));
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
                            <a href="buchung.html?id=${wohnung._id}" class="btn btn-primary w-100 mt-3">Jetzt buchen</a>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

        initMapsFerienwohnungen(filteredWohnungen);
    }
}

// Initialize maps for apartments
function initMapsFerienwohnungen(ferienwohnungen) {
    ferienwohnungen.forEach(wohnung => {
        if (wohnung.lat && wohnung.lng) {  // Ensure lat/lng exist
            const map = new google.maps.Map(document.getElementById(`map${wohnung._id}`), {
                center: { lat: wohnung.lat, lng: wohnung.lng },
                zoom: 10
            });
            new google.maps.Marker({
                position: { lat: wohnung.lat, lng: wohnung.lng },
                map: map
            });
        } else {
            console.error(`Missing lat/lng for ${wohnung.name}`);
        }
    });
}

// Handle preselection of apartment for the booking form
function handlePreselectedApartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedWohnungId = urlParams.get('id');
    if (selectedWohnungId) {
        document.getElementById('wohnungDropdown').value = selectedWohnungId;
        updateWohnungDetails(selectedWohnungId);
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
        initMapBuchung(wohnung);
    })
    .catch(error => console.error('Fehler beim Laden der Ferienwohnung:', error));
}

// Initialize the map for the selected apartment on the booking page
function initMapBuchung(wohnung) {
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.style.display = 'block'; // Show the map container

    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: wohnung.lat, lng: wohnung.lng },
        zoom: 12
    });

    new google.maps.Marker({
        position: { lat: wohnung.lat, lng: wohnung.lng },
        map: map
    });
}

// Set the minimum date to today for the check-in and check-out fields
function setMinDateForBooking() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkin').setAttribute('min', today);
    document.getElementById('checkout').setAttribute('min', today);
}

// Admin functionality: Load and manage listings (with authentication)
function loadInserateVerwaltung() {
    fetch('/api/ferienwohnungen', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    })
    .then(response => response.json())
    .then(ferienwohnungen => {
        const inserateContainer = document.getElementById('inserate-container');
        inserateContainer.innerHTML = ''; // Clear previous content
        
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
    })
    .catch(error => console.error('Fehler beim Laden der Inserate:', error));
}

window.deleteInserat = function(id) {
    fetch(`/api/ferienwohnungen/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        alert('Inserat gelöscht');
        loadInserateVerwaltung(); // Reload after deletion
    })
    .catch(error => console.error('Fehler beim Löschen des Inserats:', error));
}

window.editInserat = function(id) {
    alert(`Inserat ${id} bearbeiten`);  // Placeholder: Implement editing functionality here
}

document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const profileLink = document.getElementById('profileLink');
    const adminNav = document.getElementById('adminNav');  // Admin-Link

    // Überprüfe, ob das Authentifizierungs-Token vorhanden ist
    if (authToken) {
        loginNav.style.display = 'none';  // Verstecke den Login-Link
        logoutNav.style.display = 'block'; // Zeige den Logout-Link
        profileLink.style.display = 'block'; // Zeige den Profil-Link

        // Zeige den Admin-Link nur, wenn die Rolle 'admin' ist
        if (userRole === 'admin') {
            adminNav.style.display = 'block';
        }
    } else {
        loginNav.style.display = 'block';  // Zeige den Login-Link
        logoutNav.style.display = 'none';  // Verstecke den Logout-Link
        profileLink.style.display = 'none';  // Verstecke den Profil-Link
        adminNav.style.display = 'none';  // Verstecke den Admin-Link
    }

    // Logout-Event
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('authToken');  // Entferne Token
            localStorage.removeItem('userRole');   // Entferne User-Rolle
            window.location.href = 'index.html';   // Umleiten nach Logout
        });
    }
});

// Load and manage listings
document.addEventListener('DOMContentLoaded', () => {
    const inseratForm = document.getElementById('inseratForm');

    // Event listener for adding new listings
    if (inseratForm) {
        inseratForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const name = document.getElementById('name').value;
            const ort = document.getElementById('ort').value;
            const beschreibung = document.getElementById('beschreibung').value;
            const preis = document.getElementById('preis').value;
            const address = document.getElementById('address').value;

            // Geocode the address using Google Maps API
            geocodeAddress(address, function(latLng) {
                const newInserat = {
                    name: name,
                    ort: ort,
                    beschreibung: beschreibung,
                    preis: preis,
                    lat: latLng.lat,
                    lng: latLng.lng,
                    verfuegbarkeit: true
                };
                
                // Save the listing with lat/lng values
                fetch('/api/ferienwohnungen', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(newInserat)
                })
                .then(response => {
                    if (response.ok) {
                        alert('Ferienwohnung erfolgreich hinzugefügt');
                        inseratForm.reset();
                        loadInserateVerwaltung();
                    } else {
                        throw new Error('Fehler beim Hinzufügen der Ferienwohnung');
                    }
                })
                .catch(error => console.error('Fehler:', error));
            });
        });
    }
});

// Function to geocode address
function geocodeAddress(address, callback) {
    fetch(`/api/google-maps-key`)
    .then(response => response.json())
    .then(data => {
        const apiKey = data.apiKey;
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        
        fetch(geocodeUrl)
        .then(response => response.json())
        .then(geocodeData => {
            if (geocodeData.status === 'OK') {
                const latLng = geocodeData.results[0].geometry.location;
                callback(latLng);
            } else {
                alert('Fehler beim Geocodieren der Adresse');
            }
        })
        .catch(error => console.error('Geocoding error:', error));
    })
    .catch(error => console.error('Error fetching Google Maps API key:', error));
}

// Fetch Google Maps API Key and load the script dynamically
fetch('/api/google-maps-key')
    .then(response => response.json())
    .then(data => {
        const googleMapsApiKey = data.apiKey;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMap`;
        document.head.appendChild(script);
    })
    .catch(error => console.error('Error loading Google Maps API key:', error));

function initMap() {
    // This function will be called automatically by Google Maps API script
}
