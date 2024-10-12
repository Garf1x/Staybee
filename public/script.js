document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    if (page === 'ferienwohnungen') {
        loadFerienwohnungenFromDB();
    } else if (page === 'buchung') {
        if (checkLoginStatus()) {
            document.getElementById('bookingFormContainer').style.display = 'block';
            loadWohnungDetails();
        } else {
            document.getElementById('loginMessage').style.display = 'block';
        }
    } else if (page === 'buchungen') {
        if (checkLoginStatus()) {
            loadUserBookings();
        } else {
            alert('Bitte loggen Sie sich ein, um Ihre Buchungen zu sehen.');
            window.location.href = 'login.html';
        }
    }
    
    async function loadUserBookings() {
        try {
            const token = localStorage.getItem('authToken');
            console.log('Auth Token:', token); // Debug: Überprüfe den Authentifizierungstoken
            const response = await fetch('/api/buchungen', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Fehler beim Laden der Buchungen');
            }

            const buchungen = await response.json();
            console.log('Buchungen:', buchungen); // Debug: Überprüfe die abgerufenen Buchungen
            const container = document.getElementById('buchungen-container');
            container.innerHTML = '';

            if (buchungen.length === 0) {
                container.innerHTML = '<p>Keine Buchungen gefunden.</p>';
            } else {
                buchungen.forEach(buchung => {
                    const card = `
                        <div class="col-md-4">
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h5 class="card-title">Buchung für ${buchung.wohnungId.name}</h5>
                                    <p class="card-text"><strong>Check-in:</strong> ${new Date(buchung.checkin).toLocaleDateString()}</p>
                                    <p class="card-text"><strong>Check-out:</strong> ${new Date(buchung.checkout).toLocaleDateString()}</p>
                                    <p class="card-text"><strong>Ort:</strong> ${buchung.wohnungId.ort}</p>
                                    <p class="card-text"><strong>Preis:</strong> ${buchung.wohnungId.preis} €</p>
                                </div>
                            </div>
                        </div>
                    `;
                    container.innerHTML += card;
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden der Buchungen:', error);
            alert('Fehler beim Laden der Buchungen. Bitte versuchen Sie es später erneut.');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const page = document.body.getAttribute('data-page');
        if (page === 'buchungen') {
            loadUserBookings();
        }
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Login-Logik hier
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
                e.preventDefault();
    
                const data = {
                    email: document.getElementById('email').value,
                    kennwort: document.getElementById('password').value
                };
    
                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
    
                    if (response.ok) {
                        const result = await response.json();
                        localStorage.setItem('authToken', result.token); // Speichert das JWT im LocalStorage
                        localStorage.setItem('userRole', result.rolle);  // Speichert die Benutzerrolle (admin/user)
    
                        alert('Login erfolgreich');
                        window.location.href = 'index.html'; // Weiterleitung zur Startseite nach erfolgreichem Login
                    } else {
                        const error = await response.json();
                        alert('Fehler beim Login: ' + error.message);
                    }
                } catch (error) {
                    console.error('Fehler beim Login:', error);
                    alert('Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut.');
                }
            });
        });
    }

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Buchungs-Logik hier
        });
    }
    
    function checkLoginStatus() {
        const token = localStorage.getItem('authToken');
        return !!token;
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        const page = document.body.getAttribute('data-page');
        if (page === 'buchungen') {
            if (checkLoginStatus()) {
                loadUserBookings();
            } else {
                alert('Bitte loggen Sie sich ein, um Ihre Buchungen zu sehen.');
                window.location.href = 'login.html';
            }
        }
    });

    
    function checkLoginStatus() {
        const authToken = localStorage.getItem('authToken');
        return !!authToken; // Gibt true zurück, wenn ein Token vorhanden ist, andernfalls false
    }
    
        const dateInput = document.querySelector('input[type="date"]');
        if (dateInput) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const todayFormatted = year + '-' + month + '-' + day;
            dateInput.setAttribute('min', todayFormatted);
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

        // Map initialisieren für jedes Apartment
        initMapsFerienwohnungen(ferienwohnungen);

    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

// Map initialisieren für jedes Apartment
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

// Hole den Google Maps API-Schlüssel und lade das Skript
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

    // Initialisiere seiten-spezifische Funktionalitäten
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

// Lade Ferienwohnungen für die Buchungsseite
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

        handlePreselectedApartment(); // Sicherstellen, dass die vorausgewählte Wohnung nach dem Laden richtig ausgewählt ist
    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

// Suchfunktionalität auf der Apartmentseite initialisieren
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

// Zeige gefilterte Ferienwohnungen basierend auf der Sucheingabe an
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

// Initialisiere die Karte für die ausgewählte Wohnung auf der Buchungsseite
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

// Bearbeite die Vorauswahl der Wohnung für das Buchungsformular
function handlePreselectedApartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedWohnungId = urlParams.get('id');
    if (selectedWohnungId) {
        const wohnungDropdown = document.getElementById('wohnungDropdown');

        // Warten, bis die Wohnungen in das Dropdown geladen sind
        setTimeout(() => {
            wohnungDropdown.value = selectedWohnungId;
            updateWohnungDetails(selectedWohnungId);
        }, 100); // Leichte Verzögerung, um sicherzustellen, dass das Dropdown-Menü gefüllt ist
    }
}

// Aktualisiere die Details der ausgewählten Wohnung auf der Buchungsseite
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
        wohnungBilder.innerHTML = '';  // Lösche alle vorherigen Bilder
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

// Admin funktion: Ferienwohnungen laden und managen
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

// Ferienwohnungen löschen
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

// Platzhalterfunktion zum Bearbeiten eines Inserats
window.editInserat = function(id) {
    alert(`Inserat ${id} bearbeiten`);
}

// Authentifizierung und Navigation Sichtbarkeit handhaben
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
    async function loadUserBookings() {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/buchungen', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const buchungen = await response.json();
          const container = document.getElementById('buchungen-container');
          container.innerHTML = '';
      
          buchungen.forEach(buchung => {
            if (buchung.wohnungId) {
              const card = `
                <div class="col-md-4">
                  <div class="card mb-4">
                    <div class="card-body">
                      <h5 class="card-title">Buchung für ${buchung.wohnungId.name}</h5>
                      <p class="card-text"><strong>Check-in:</strong> ${new Date(buchung.checkin).toLocaleDateString()}</p>
                      <p class="card-text"><strong>Check-out:</strong> ${new Date(buchung.checkout).toLocaleDateString()}</p>
                      <p class="card-text"><strong>Ort:</strong> ${buchung.wohnungId.ort}</p>
                      <p class="card-text"><strong>Preis:</strong> ${buchung.wohnungId.preis} €</p>
                    </div>
                  </div>
                </div>
              `;
              container.innerHTML += card;
            } else {
              console.error(`Buchung ${buchung._id} hat keine gültige wohnungId`);
            }
          });
        } catch (error) {
          console.error('Fehler beim Laden der Buchungen:', error);
        }
      }
    
        if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
        });
    }

    if (page === 'buchungen') {
        if (authToken) {
            loadUserBookings();
        } else {
            alert('Bitte loggen Sie sich ein, um Ihre Buchungen zu sehen.');
            window.location.href = 'login.html';
        }
    }
});

// Hinzufügen und Absenden eines neuen Inserats
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

async function loadWohnungDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const wohnungId = urlParams.get('id');

    if (wohnungId) {
        try {
            const response = await fetch(`/api/ferienwohnungen/${wohnungId}`);
            const wohnung = await response.json();

            document.getElementById('wohnung-bild').src = wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png';
            initializeMap(wohnung._id, wohnung.latitude, wohnung.longitude);
        } catch (error) {
            console.error('Error loading wohnung details:', error);
        }
    }
}

function initializeMap(id, lat, lng) {
    const map = new google.maps.Map(document.getElementById('wohnung-karte'), {
        center: { lat: lat, lng: lng },
        zoom: 15
    });

    new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    if (page === 'buchung') {
        loadWohnungDetails();
    }

    const dateInput = document.querySelector('input[type="date"]');
    
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Januar ist 0
        const year = today.getFullYear();
        
        const todayFormatted = year + '-' + month + '-' + day;
        
        dateInput.setAttribute('min', todayFormatted);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    if (page === 'buchung') {
        if (checkLoginStatus()) {
            document.getElementById('bookingFormContainer').style.display = 'block';
            loadWohnungDetails();
        } else {
            document.getElementById('loginMessage').style.display = 'block';
        }
    }

    const dateInput = document.querySelector('input[type="date"]');
    
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Januar ist 0
        const year = today.getFullYear();
        
        const todayFormatted = year + '-' + month + '-' + day;
        
        dateInput.setAttribute('min', todayFormatted);
    }
});

async function loadWohnungDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const wohnungId = urlParams.get('id');

    if (wohnungId) {
        try {
            const response = await fetch(`/api/ferienwohnungen/${wohnungId}`);
            const wohnung = await response.json();

            // Update das Bild
            const wohnungBild = document.getElementById('wohnung-bild');
            wohnungBild.src = wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png';

            // Karte initialisieren
            initializeMap(wohnung._id, wohnung.lat, wohnung.lng);
        } catch (error) {
            console.error('Error loading wohnung details:', error);
        }
    }
}

function initializeMap(id, lat, lng) {
    const map = new google.maps.Map(document.getElementById('wohnung-karte'), {
        center: { lat: lat, lng: lng },
        zoom: 15
    });

    new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map
    });
}
document.getElementById('bookingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        wohnungId: document.getElementById('wohnungDropdown').value,
        checkin: document.getElementById('checkin').value,
        checkout: document.getElementById('checkout').value,
        zustellbett: document.getElementById('zustellbett').checked,
        kinderbett: document.getElementById('kinderbett').checked,
        fruehstueck: document.getElementById('fruehstueck').checked,
        parkplatz: document.getElementById('parkplatz').checked
    };

    try {
        const response = await fetch('/api/buchungen', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Buchung erfolgreich');
            window.location.href = 'index.html'; // Weiterleitung zur Startseite nach erfolgreicher Buchung
        } else {
            const error = await response.json();
            alert('Fehler bei der Buchung: ' + error.message);
        }
    } catch (error) {
        console.error('Fehler bei der Buchung:', error);
        alert('Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    if (page === 'buchung') {
        if (checkLoginStatus()) {
            document.getElementById('bookingFormContainer').style.display = 'block';
            loadFerienwohnungenForBooking();
            loadWohnungDetails();
        } else {
            document.getElementById('loginMessage').style.display = 'block';
        }
    }

    const dateInput = document.querySelector('input[type="date"]');
    
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Januar ist 0
        const year = today.getFullYear();
        
        const todayFormatted = year + '-' + month + '-' + day;
        
        dateInput.setAttribute('min', todayFormatted);
    }
});

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

        handlePreselectedApartment(); // Sicherstellen, dass die vorausgewählte Wohnung nach dem Laden richtig ausgewählt ist
    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

async function loadWohnungDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const wohnungId = urlParams.get('id');

    if (wohnungId) {
        try {
            const response = await fetch(`/api/ferienwohnungen/${wohnungId}`);
            const wohnung = await response.json();

            const wohnungBild = document.getElementById('wohnung-bild');
            wohnungBild.src = wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png';

            initializeMap(wohnung._id, wohnung.lat, wohnung.lng);
        } catch (error) {
            console.error('Error loading wohnung details:', error);
        }
    }
}

function checkLoginStatus() {
    const authToken = localStorage.getItem('authToken');
    return !!authToken; // Gibt true zurück, wenn ein Token vorhanden ist, andernfalls false
}

function initializeMap(id, lat, lng) {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer && lat && lng) {
        mapContainer.style.display = 'block';

        const map = new google.maps.Map(mapContainer, {
            center: { lat: lat, lng: lng },
            zoom: 12
        });

        new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map
        });
    }
}
