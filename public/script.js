document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    // Initialize page-specific functionality
    if (page === 'ferienwohnungen') {
        loadFerienwohnungenFromDB();  // Holt Ferienwohnungen aus der Datenbank
        initializeSearchFunctionality();
    } else if (page === 'buchung') {
        loadFerienwohnungenForBooking();  // Holt Ferienwohnungen für die Buchungsseite
        handlePreselectedApartment();
        setMinDateForBooking();
        document.getElementById('wohnungDropdown').addEventListener('change', function() {
            const wohnungId = this.value;
            updateWohnungDetails(wohnungId);
        });
    } else if (page === 'inserate-bearbeiten') {
        loadInserateVerwaltung();  // Holt Inserate für Admins
    }
});

// Ferienwohnungen aus der Datenbank laden und auf der Ferienwohnungsseite anzeigen
function loadFerienwohnungenFromDB() {
    // Fetch without Authorization for public access
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
                            <img src="${wohnung.bild}" class="card-img-top" alt="${wohnung.name}">
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

        // Karten für die Wohnungen initialisieren
        initMapsFerienwohnungen(ferienwohnungen);
    })
    .catch(error => console.error('Fehler beim Laden der Ferienwohnungen:', error));
}

// Ferienwohnungen aus der Datenbank laden und für die Buchungseite anzeigen
function loadFerienwohnungenForBooking() {
    // Fetch without Authorization for public access
    fetch('/api/ferienwohnungen')
    .then(response => response.json())
    .then(ferienwohnungen => {
        const wohnungDropdown = document.getElementById('wohnungDropdown');
        wohnungDropdown.innerHTML = `<option value="" selected>Bitte wählen...</option>`; // Reset Dropdown

        ferienwohnungen.forEach(wohnung => {
            const option = document.createElement('option');
            option.value = wohnung._id;
            option.textContent = `${wohnung.name} (${wohnung.ort})`;
            wohnungDropdown.appendChild(option);
        });
    })
    .catch(error => console.error('Fehler beim Laden der Ferienwohnungen:', error));
}

// Initialize search functionality on the Ferienwohnungen page
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
                            <img src="${wohnung.bild}" class="card-img-top" alt="${wohnung.name}">
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

        // Initialize the maps for each apartment
        initMapsFerienwohnungen(filteredWohnungen);
    }
}

// Karten für die Wohnungen auf der Ferienwohnungsseite initialisieren
function initMapsFerienwohnungen(ferienwohnungen) {
    ferienwohnungen.forEach(wohnung => {
        const map = L.map(`map${wohnung._id}`).setView([wohnung.lat, wohnung.lng], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker([wohnung.lat, wohnung.lng]).addTo(map);
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
            <img src="${wohnung.bild}" class="img-fluid mb-3 small-image" alt="${wohnung.name}">
            <p><strong>Ort:</strong> ${wohnung.ort}</p>
            <p>${wohnung.beschreibung}</p>
        `;
    })
    .catch(error => console.error('Fehler beim Laden der Ferienwohnung:', error));
}

// Set the minimum date to today for the check-in and check-out fields
function setMinDateForBooking() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkin').setAttribute('min', today);
    document.getElementById('checkout').setAttribute('min', today);
}

// Admin functionality: Inserate bearbeiten (mit Authentifizierung)
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
                            <img src="${wohnung.bild}" class="card-img-top" alt="${wohnung.name}">
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
    const adminNav = document.getElementById('adminNav');

    // Überprüfe, ob ein Authentifizierungstoken vorhanden ist
    if (authToken) {
        loginNav.style.display = 'none';
        logoutNav.style.display = 'block';

        // Wenn der Benutzer ein Admin ist, zeige den Admin-Link
        if (userRole === 'admin') {
            adminNav.style.display = 'block';
        }
    } else {
        loginNav.style.display = 'block';
        logoutNav.style.display = 'none';
        adminNav.style.display = 'none'; // Admin-Link verstecken, wenn nicht eingeloggt
    }

    // Logout-Event
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
        });
    }
});

// Laden und Verwalten der Inserate
document.addEventListener('DOMContentLoaded', () => {
    const inseratForm = document.getElementById('inseratForm');

    // Event-Listener für das Formular zum Hinzufügen neuer Inserate
    if (inseratForm) {
        inseratForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const name = document.getElementById('name').value;
            const ort = document.getElementById('ort').value;
            const beschreibung = document.getElementById('beschreibung').value;
            const preis = document.getElementById('preis').value;

            const newInserat = {
                name: name,
                ort: ort,
                beschreibung: beschreibung,
                preis: preis,
                verfuegbarkeit: true // Standardwert für Verfügbarkeit
            };

            // Fetch-Request an die API zum Hinzufügen des Inserats
            fetch('/api/ferienwohnungen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Token für Authentifizierung
                },
                body: JSON.stringify(newInserat)
            })
            .then(response => {
                if (response.ok) {
                    alert('Ferienwohnung erfolgreich hinzugefügt');
                    inseratForm.reset();
                    loadInserateVerwaltung(); // Die Inserate erneut laden
                } else {
                    throw new Error('Fehler beim Hinzufügen der Ferienwohnung');
                }
            })
            .catch(error => console.error('Fehler:', error));
        });
    }
});
