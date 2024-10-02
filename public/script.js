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
            beschreibung: 'Genießen Sie die atemberaubende Aussicht.',
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

    const page = document.body.getAttribute('data-page');
    
    // Initialize page-specific functionality
    if (page === 'ferienwohnungen') {
        loadFerienwohnungen();
        initializeSearchFunctionality();
    } else if (page === 'buchung') {
        populateDropdown();
        handlePreselectedApartment();
        setMinDateForBooking(); // Set the minimum date for booking fields
        document.getElementById('wohnungDropdown').addEventListener('change', function() {
            const wohnungId = this.value;
            updateWohnungDetails(wohnungId);
        });
    } else if (page === 'inserate-bearbeiten') {
        loadInserateVerwaltung();
    }

    // Function to load apartments on the Ferienwohnungen page
    function loadFerienwohnungen() {
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
                            <div id="map${wohnung.id}" style="height: 200px; width: 100%;"></div>
                            <a href="buchung.html?id=${wohnung.id}" class="btn btn-primary w-100 mt-3">Jetzt buchen</a>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

        // Initialize the maps for each apartment
        initMapsFerienwohnungen();
    }

    // Function to initialize maps on the Ferienwohnungen page
    function initMapsFerienwohnungen() {
        ferienwohnungen.forEach(wohnung => {
            const map = L.map(`map${wohnung.id}`).setView([wohnung.lat, wohnung.lng], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            L.marker([wohnung.lat, wohnung.lng]).addTo(map);
        });
    }

    // Populate the dropdown on the Buchung page
    function populateDropdown() {
        const wohnungDropdown = document.getElementById('wohnungDropdown');
        wohnungDropdown.innerHTML = `<option value="" selected>Bitte wählen...</option>`; // Reset Dropdown
        ferienwohnungen.forEach(wohnung => {
            const option = document.createElement('option');
            option.value = wohnung.id;
            option.textContent = `${wohnung.name} (${wohnung.ort})`;
            wohnungDropdown.appendChild(option);
        });
    }

    // Update details of the selected apartment on the Buchung page
    function updateWohnungDetails(wohnungId) {
        const wohnung = ferienwohnungen.find(w => w.id == wohnungId);
        if (wohnung) {
            displayWohnungDetails(wohnung);
            initMapBuchung(wohnung);
        } else {
            document.getElementById('wohnungDetails').innerHTML = `<p>Ferienwohnung nicht gefunden.</p>`;
        }
    }

    // Display details of the selected apartment on the Buchung page and apply the small image class
    function displayWohnungDetails(wohnung) {
        document.getElementById('wohnungDetails').innerHTML = `
            <img src="${wohnung.bild}" class="img-fluid mb-3 small-image" alt="${wohnung.name}">
            <p><strong>Ort:</strong> ${wohnung.ort}</p>
            <p>${wohnung.beschreibung}</p>
        `;
    }

    // Initialize the map on the Buchung page
    function initMapBuchung(wohnung) {
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

    // Function to handle preselection of apartment from the URL
    function handlePreselectedApartment() {
        const urlParams = new URLSearchParams(window.location.search);
        const selectedWohnungId = urlParams.get('id');
    
        if (selectedWohnungId) {
            document.getElementById('wohnungDropdown').value = selectedWohnungId;
            updateWohnungDetails(selectedWohnungId);
        }
    }

    // Function to set the minimum date to today for the check-in and check-out fields
    function setMinDateForBooking() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('checkin').setAttribute('min', today);
        document.getElementById('checkout').setAttribute('min', today);
    }

    // Initialize search functionality on the Ferienwohnungen page
    function initializeSearchFunctionality() {
        document.getElementById('searchInput').addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            const filteredWohnungen = ferienwohnungen.filter(wohnung =>
                wohnung.ort.toLowerCase().includes(searchValue)
            );
            displayFilteredWohnungen(filteredWohnungen);
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
                                <div id="map${wohnung.id}" style="height: 200px; width: 100%;"></div>
                                <a href="buchung.html?id=${wohnung.id}" class="btn btn-primary w-100 mt-3">Jetzt buchen</a>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += card;
            });
            initMapsFerienwohnungen();
        }
    }

    // Process the booking form submission
    document.getElementById('buchungsForm')?.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const checkin = document.getElementById('checkin').value;
        const checkout = document.getElementById('checkout').value;

        // Process multiple selected additional offers
        const zusatzangebote = Array.from(document.getElementById('zusatzangebote').selectedOptions)
            .map(option => option.text);

        alert(`Buchung erfolgreich für: ${name}\nE-Mail: ${email}\nCheck-in: ${checkin}\nCheck-out: ${checkout}\nZusatzangebote: ${zusatzangebote.join(', ')}`);
    });

    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Verhindert das Standardformular-Verhalten

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email, kennwort: password }) // Anpassung an die erwartete API-Struktur
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Login fehlgeschlagen');
                }
                return response.json();
            })
            .then(data => {
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userRole', data.rolle);
                    window.location.href = 'index.html'; // Weiterleitung nach erfolgreichem Login
                } else {
                    alert('Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut.');
                }
            })
            .catch(error => console.error('Fehler beim Login:', error));
        });
    }

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = 'index.html'; // Weiterleitung nach dem Logout
        });
    }
    
    // Admin functionality: Inserate bearbeiten
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
        // Placeholder: Implement editing functionality here
        alert(`Inserat ${id} bearbeiten`);
    }

});

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

document.addEventListener('DOMContentLoaded', () => {
    // Laden und Verwalten der Inserate
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
