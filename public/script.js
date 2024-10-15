document.addEventListener('DOMContentLoaded', () => {
    // Liest den Wert des Attributs 'data-page' aus dem <body>-Tag aus, um zu wissen, welche Seite geladen ist
    const page = document.body.getAttribute('data-page');

    // Überprüft, welche Seite aufgerufen wurde
    if (page === 'ferienwohnungen') {
        loadFerienwohnungenFromDB(); 
    } else if (page === 'buchung') {
        // Überprüft, ob der Benutzer eingeloggt ist, bevor das Buchungsformular angezeigt wird
        if (checkLoginStatus()) {
            document.getElementById('bookingFormContainer').style.display = 'block'; 
            loadWohnungDetails(); 
        } else {
            document.getElementById('loginMessage').style.display = 'block'; // Zeigt eine Nachricht an, dass der Benutzer sich einloggen muss
        }
    } else if (page === 'buchungen') {
        // Überprüft, ob der Benutzer eingeloggt ist, um meine Buchungen anzuzeigen
        if (checkLoginStatus()) {
            loadUserBookings(); 
        } else {
            alert('Bitte loggen Sie sich ein, um Ihre Buchungen zu sehen.');
            window.location.href = 'login.html'; // Leitet zur Login-Seite um
        }
    }

    // Definiert eine asynchrone Funktion zum Abrufen der Buchungen des Benutzers
    async function loadUserBookings() {
        try {
            const token = localStorage.getItem('authToken'); // Holt das Authentifizierungstoken aus dem Local Storage
            console.log('Auth Token:', token); // Debug: Zeigt das Token im Konsolen-Log

            // Sendet eine Anfrage an den Server, um die Buchungen zu laden
            const response = await fetch('/api/buchungen', {
                headers: {
                    'Authorization': `Bearer ${token}` // Sendet das Token zur Authentifizierung
                }
            });

            if (!response.ok) {
                throw new Error('Fehler beim Laden der Buchungen'); // Wenn die Antwort nicht erfolgreich ist, wird ein Fehler geworfen
            }

            const buchungen = await response.json(); // Wandelt die Antwort in ein JSON-Objekt um
            console.log('Buchungen:', buchungen); // Debug: Zeigt die Buchungsdaten im Konsolen-Log

            const container = document.getElementById('buchungen-container'); // Holt den Container, wo die Buchungen angezeigt werden sollen
            container.innerHTML = ''; // Löscht den Inhalt des Containers

            if (buchungen.length === 0) { // Wenn keine Buchungen existieren
                container.innerHTML = '<p>Keine Buchungen gefunden.</p>'; 
            } else {
                // Erstellt und fügt eine Karte für jede Buchung hinzu
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
                    container.innerHTML += card; // Fügt die Karte in den Container ein
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden der Buchungen:', error);
            alert('Fehler beim Laden der Buchungen. Bitte versuchen Sie es später erneut.');
        }
    }

    // Wiederholt das Hinzufügen eines DOMContentLoaded-Eventlisteners
    document.addEventListener('DOMContentLoaded', () => {
        const page = document.body.getAttribute('data-page');
        if (page === 'buchungen') {
            loadUserBookings();
        }
    });

    // Holt das Login-Formular und fügt einen Event-Listener für die Formularübermittlung hinzu
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Verhindert das Standardformular-Verhalten

            const data = {
                email: document.getElementById('email').value,
                kennwort: document.getElementById('password').value
            };

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data) // Senden der Anmeldedaten als JSON
                });

                if (response.ok) {
                    const result = await response.json();
                    localStorage.setItem('authToken', result.token); // Speichert das Authentifizierungstoken im Local Storage
                    localStorage.setItem('userRole', result.rolle);  // Speichert die Benutzerrolle

                    alert('Login erfolgreich');
                    window.location.href = 'index.html'; // Weiterleitung zur Startseite
                } else {
                    const error = await response.json();
                    alert('Fehler beim Login: ' + error.message); // Zeigt eine Fehlermeldung an
                }
            } catch (error) {
                console.error('Fehler beim Login:', error);
                alert('Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut.');
            }
        });
    }

    // Holt das Buchungsformular und fügt einen Event-Listener für die Formularübermittlung hinzu
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
        });
    }

    // Funktion zur Überprüfung, ob der Benutzer eingeloggt ist, indem nach dem Token im Local Storage gesucht wird
    function checkLoginStatus() {
        const token = localStorage.getItem('authToken');
        return !!token; // Gibt true zurück, wenn das Token vorhanden ist, andernfalls false
    }

    // Wiederholte DOMContentLoaded-Funktion zur Seite "Buchungen"
    document.addEventListener('DOMContentLoaded', () => {
        const page = document.body.getAttribute('data-page');
        if (page === 'buchungen') {
            if (checkLoginStatus()) {
                loadUserBookings(); 
            } else {
                alert('Bitte loggen Sie sich ein, um Ihre Buchungen zu sehen.');
                window.location.href = 'login.html'; // Leitet zur Login-Seite um
            }
        }
    });

    // Diese Funktion prüft erneut den Login-Status durch Suche nach dem Token
    function checkLoginStatus() {
        const authToken = localStorage.getItem('authToken');
        return !!authToken; // Gibt true zurück, wenn ein Token vorhanden ist
    }

    // Setzt das Mindestdatum eines Datum-Eingabefeldes auf das heutige Datum
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const todayFormatted = year + '-' + month + '-' + day;
        dateInput.setAttribute('min', todayFormatted); // Mindestdatum setzen
    }
});

// Lädt Ferienwohnungen aus der Datenbank und zeigt diese an
async function loadFerienwohnungenFromDB() {
    try {
        const response = await fetch('/api/ferienwohnungen');
        const ferienwohnungen = await response.json();

        const container = document.getElementById('ferienwohnungen-container');
        container.innerHTML = ''; // Container-Inhalt löschen

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
            container.innerHTML += card; // Fügt die HTML-Karte dem Container hinzu
        });

        // Initialisiert Google Maps für jede Ferienwohnung
        initMapsFerienwohnungen(ferienwohnungen);

    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

// Initialisiert die Map für jede Ferienwohnung basierend auf ihren Koordinaten
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

// Holt den Google Maps API-Schlüssel und fügt das Skript dynamisch dem Dokument hinzu
fetch('/api/google-maps-key')
    .then(response => response.json())
    .then(data => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=initializeMaps`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script); // Fügt das Google Maps Skript dem Dokument hinzu
    })
    .catch(error => console.error('Error fetching Google Maps API Key:', error));

// Initialisiert die Google Maps API und überprüft, ob die Initialisierungsfunktion vorhanden ist
function initializeMaps() {
    if (typeof initMapsFerienwohnungen === 'function') {
        console.log("Google Maps API loaded and initializing maps.");
    } else {
        console.error('initMapsFerienwohnungen function not found.');
    }
}

// Wartet, bis die Seite vollständig geladen ist, bevor der Code ausgeführt wird
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page'); // Liest den Seitentyp aus

    // Startet die seiten-spezifische Funktionalität basierend auf dem Wert von 'data-page'
    switch (page) {
        case 'ferienwohnungen':
            loadFerienwohnungenFromDB(); // Lädt die Ferienwohnungen
            initializeSearchFunctionality(); // Initialisiert die Suchfunktion
            initializeMaps(); // Initialisiert Karten
            break;
        case 'buchung':
            loadFerienwohnungenForBooking(); // Lädt Ferienwohnungen für das Buchungsformular
            handlePreselectedApartment(); // Wählt eine vorausgewählte Wohnung, falls vorhanden
            setMinDateForBooking(); // Setzt das Mindestdatum für Buchungsauswahl
            document.getElementById('wohnungDropdown').addEventListener('change', (event) => {
                updateWohnungDetails(event.target.value); // Aktualisiert die Wohnungsauswahl basierend auf Dropdown-Änderungen
            });
            break;
        case 'inserate-bearbeiten':
            loadInserateVerwaltung(); // Lädt die Verwaltung der Inserate
            break;
    }
});

// Funktion, um Ferienwohnungen für die Buchungsseite zu laden
async function loadFerienwohnungenForBooking() {
    try {
        const response = await fetch('/api/ferienwohnungen'); // API-Anfrage zur Datenbank
        const ferienwohnungen = await response.json();
        const wohnungDropdown = document.getElementById('wohnungDropdown');
        wohnungDropdown.innerHTML = `<option value="" selected>Bitte wählen...</option>`; // Initialisiert Dropdown-Option

        ferienwohnungen.forEach(wohnung => {
            const option = document.createElement('option'); // Erzeugt eine Option für jede Ferienwohnung
            option.value = wohnung._id;
            option.textContent = `${wohnung.name} (${wohnung.ort})`;
            wohnungDropdown.appendChild(option);
        });

        handlePreselectedApartment(); // Wählt eine vorausgewählte Wohnung, wenn vorhanden
    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

// Initialisiert die Suchfunktion für Ferienwohnungen
function initializeSearchFunctionality() {
    document.getElementById('searchInput').addEventListener('input', async function() {
        const searchValue = this.value.toLowerCase(); // Holt und normalisiert den Suchbegriff
        try {
            const response = await fetch('/api/ferienwohnungen');
            const ferienwohnungen = await response.json();
            // Filtert die Wohnungen basierend auf dem Ort
            const filteredWohnungen = ferienwohnungen.filter(wohnung =>
                wohnung.ort.toLowerCase().includes(searchValue)
            );
            displayFilteredWohnungen(filteredWohnungen); // Zeigt gefilterte Wohnungen an
        } catch (error) {
            console.error('Fehler beim Laden der Ferienwohnungen:', error);
        }
    });
}

// Zeigt Ferienwohnungen basierend auf der Filterung an
function displayFilteredWohnungen(filteredWohnungen) {
    const container = document.getElementById('ferienwohnungen-container');
    container.innerHTML = ''; // Container leeren

    if (filteredWohnungen.length === 0) {
        container.innerHTML = `<p>Keine Ferienwohnungen gefunden.</p>`; // Meldung bei fehlenden Ergebnissen
    } else {
        // Erstellt eine Karte für jede gefilterte Ferienwohnung und fügt sie dem Container hinzu
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

        initMapsFerienwohnungen(filteredWohnungen); // Initialisiert Karten für die gefilterten Wohnungen
    }
}

// Initialisiert die Map für die Buchungsseite mit der spezifischen Wohnung
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

// Bearbeitet eine Vorauswahl der Ferienwohnung anhand der URL-Parameter
function handlePreselectedApartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedWohnungId = urlParams.get('id'); // Holt die ID der Wohnung aus der URL
    if (selectedWohnungId) {
        const wohnungDropdown = document.getElementById('wohnungDropdown');

        // Verzögert die Vorauswahl, um sicherzustellen, dass das Dropdown-Menü geladen ist
        setTimeout(() => {
            wohnungDropdown.value = selectedWohnungId;
            updateWohnungDetails(selectedWohnungId); // Aktualisiert die Details zur ausgewählten Wohnung
        }, 100);
    }
}

// Holt und zeigt die Details einer Wohnung basierend auf der ID an
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
        wohnungBilder.innerHTML = ''; // Löscht vorherige Bilder
        if (wohnung.bilder && wohnung.bilder.length > 0) {
            // Fügt alle Bilder der Wohnung hinzu
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

// Wartet erneut auf das Laden der Seite und führt verwaltungsspezifische Funktionen aus
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');
    if (page === 'inserate-bearbeiten') {
        loadInserateVerwaltung(); // Lädt Verwaltung, wenn auf der Inserate-Seite
    }
});

// Funktion für Administratoren, um Ferienwohnungen zu verwalten
async function loadInserateVerwaltung() {
    try {
        const response = await fetch('/api/ferienwohnungen', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Authentifiziert die Anfrage
            }
        });
        const ferienwohnungen = await response.json();
        const inserateContainer = document.getElementById('inserate-container');
        inserateContainer.innerHTML = ''; // Leert den Container

        // Erstellt eine Karte für jede Wohnung, die bearbeitet werden kann
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

// Funktion, um ein Inserat zu löschen (nicht funktional)
window.deleteInserat = async function(id) {
    try {
        const response = await fetch(`/api/ferienwohnungen/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Authentifizierungstoken für den Löschvorgang
            }
        });
        if (response.ok) {
            alert('Inserat gelöscht');
            loadInserateVerwaltung(); // Aktualisiert die Inserateliste nach Löschung
        } else {
            throw new Error('Fehler beim Löschen des Inserats');
        }
    } catch (error) {
        console.error('Fehler beim Löschen des Inserats:', error);
    }
}

// Funktion zum Bearbeiten eines Inserats (Platzhalter) (nicht funktional)
window.editInserat = function(id) {
    alert(`Inserat ${id} bearbeiten`);
}

// Wartet auf das Laden der Seite, um die Navigation abhängig vom Authentifizierungsstatus zu steuern
document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken'); // Authentifizierungstoken des Benutzers
    const userRole = localStorage.getItem('userRole'); // Rolle des Benutzers

    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const profileLink = document.getElementById('profileLink');
    const adminNav = document.getElementById('adminNav');

    if (authToken) {
        loginNav.style.display = 'none';
        logoutNav.style.display = 'block';
        profileLink.style.display = 'block';

        if (userRole === 'admin') {
            adminNav.style.display = 'block'; // Zeigt Admin-Optionen für Administratoren an
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
              'Authorization': `Bearer ${token}` // Sendet das Token für geschützte Ressourcen
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
            window.location.href = 'index.html'; // Leitet zur Startseite um
        });
    }

    if (page === 'buchungen') {
        if (authToken) {
            loadUserBookings();
        } else {
            alert('Bitte loggen Sie sich ein, um Ihre Buchungen zu sehen.');
            window.location.href = 'login.html'; // Weiterleitung zur Login-Seite
        }
    }
});

// Wartet, bis die Seite geladen ist, um ein neues Inserat hinzuzufügen
document.addEventListener('DOMContentLoaded', () => {
    const inseratForm = document.getElementById('inseratForm'); // Holt das Formular-Element

    if (inseratForm) {
        inseratForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Verhindert das Standardverhalten beim Absenden des Formulars

            const formData = new FormData(inseratForm); // Erfasst alle Formulardaten

            try {
                const response = await fetch('/api/ferienwohnungen', {
                    method: 'POST', // HTTP POST-Anfrage
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Authentifizierung mit Token
                    },
                    body: formData // Sendet die Formulardaten im Anfrage-Body
                });
                if (response.ok) {
                    alert('Ferienwohnung erfolgreich hinzugefügt');
                    inseratForm.reset(); // Setzt das Formular zurück
                    loadInserateVerwaltung(); // Aktualisiert die Liste der Inserate
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

// Lädt die Details der Ferienwohnung basierend auf der ID aus der URL
async function loadWohnungDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const wohnungId = urlParams.get('id'); // Holt die ID der Wohnung aus der URL

    if (wohnungId) {
        try {
            const response = await fetch(`/api/ferienwohnungen/${wohnungId}`); // Holt die Details der Ferienwohnung
            const wohnung = await response.json();

            document.getElementById('wohnung-bild').src = wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png';
            initializeMap(wohnung._id, wohnung.latitude, wohnung.longitude); // Initialisiert die Karte mit den Wohnungsdetails
        } catch (error) {
            console.error('Error loading wohnung details:', error);
        }
    }
}

// Initialisiert die Map für die spezifische Ferienwohnung
function initializeMap(id, lat, lng) {
    const map = new google.maps.Map(document.getElementById('wohnung-karte'), {
        center: { lat: lat, lng: lng }, // Zentriert die Karte auf die übergebenen Koordinaten
        zoom: 15
    });

    new google.maps.Marker({
        position: { lat: lat, lng: lng }, // Setzt einen Marker auf der Karte
        map: map
    });
}

// Wartet auf das Laden der Seite und führt seitenabhängige Aktionen aus
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page'); // Liest den Seitentyp

    if (page === 'buchung') {
        loadWohnungDetails(); 
    }

    const dateInput = document.querySelector('input[type="date"]'); // Holt das Datumseingabefeld
    
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Korrigiert den Monatsindex
        const year = today.getFullYear();
        
        const todayFormatted = year + '-' + month + '-' + day; // Formatiert das heutige Datum
        
        dateInput.setAttribute('min', todayFormatted); // Setzt das minimale wählbare Datum
    }
});

// Funktion für Login-Status und Buchungsdetails
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page'); 

    if (page === 'buchung') {
        if (checkLoginStatus()) {
            document.getElementById('bookingFormContainer').style.display = 'block'; // Zeigt das Buchungsformular für eingeloggte Benutzer an
            loadWohnungDetails();
        } else {
            document.getElementById('loginMessage').style.display = 'block'; // Zeigt die Login-Meldung für nicht eingeloggte Benutzer an
        }
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

// Zweite Instanz der loadWohnungDetails-Funktion, die Details zur Ferienwohnung lädt und die Karte initialisiert
async function loadWohnungDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const wohnungId = urlParams.get('id');

    if (wohnungId) {
        try {
            const response = await fetch(`/api/ferienwohnungen/${wohnungId}`);
            const wohnung = await response.json();

            // Aktualisiert das Bild
            const wohnungBild = document.getElementById('wohnung-bild');
            wohnungBild.src = wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png';

            // Initialisiert die Karte mit Wohnungskoordinaten
            initializeMap(wohnung._id, wohnung.lat, wohnung.lng);
        } catch (error) {
            console.error('Error loading wohnung details:', error);
        }
    }
}

// Karte für die spezifische Wohnung auf der Buchungsseite initialisieren
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

// Für das Absenden des Buchungsformulars
document.getElementById('bookingForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert die Standard-Formularübermittlung

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
                'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Authentifizierungstoken im Header
            },
            body: JSON.stringify(data) // Sendet die Buchungsdaten als JSON
        });

        if (response.ok) {
            alert('Buchung erfolgreich');
            window.location.href = 'index.html'; // Leitet nach erfolgreicher Buchung zur Startseite weiter
        } else {
            const error = await response.json();
            alert('Fehler bei der Buchung: ' + error.message); // Fehlerbehandlung
        }
    } catch (error) {
        console.error('Fehler bei der Buchung:', error);
        alert('Ein Fehler ist aufgetreten, bitte versuchen Sie es erneut.');
    }
});

// Wartet, bis die Seite vollständig geladen ist, um seitenabhängige Aktionen durchzuführen
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page'); // Holt den aktuellen Seitentyp aus dem Attribut 'data-page'

    // Prüft, ob die aktuelle Seite die Buchungsseite ist
    if (page === 'buchung') {
        if (checkLoginStatus()) { // Prüft, ob der Benutzer eingeloggt ist
            document.getElementById('bookingFormContainer').style.display = 'block'; // Zeigt das Buchungsformular an
            loadFerienwohnungenForBooking(); // Lädt die Ferienwohnungen für die Buchungsauswahl
            loadWohnungDetails(); // Lädt Details der spezifischen Ferienwohnung
        } else {
            document.getElementById('loginMessage').style.display = 'block'; 
        }
    }

    // Setzt das Mindestdatum für das Datumseingabefeld auf das heutige Datum
    const dateInput = document.querySelector('input[type="date"]');
    
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0'); // Tag mit führender Null
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Monat mit führender Null, Januar ist 0
        const year = today.getFullYear();
        
        const todayFormatted = year + '-' + month + '-' + day; // Formatiert das Datum im Format 'YYYY-MM-DD'
        
        dateInput.setAttribute('min', todayFormatted); // Setzt das minimale wählbare Datum auf das heutige Datum
    }
});

// Lädt die Ferienwohnungen für das Dropdown-Menü auf der Buchungsseite
async function loadFerienwohnungenForBooking() {
    try {
        const response = await fetch('/api/ferienwohnungen'); // API-Anfrage zum Laden der Ferienwohnungen
        const ferienwohnungen = await response.json();
        const wohnungDropdown = document.getElementById('wohnungDropdown'); // Holt das Dropdown-Menü
        wohnungDropdown.innerHTML = `<option value="" selected>Bitte wählen...</option>`; // Setzt die Standardoption

        // Fügt jede Ferienwohnung als Option ins Dropdown-Menü hinzu
        ferienwohnungen.forEach(wohnung => {
            const option = document.createElement('option');
            option.value = wohnung._id;
            option.textContent = `${wohnung.name} (${wohnung.ort})`; // Setzt den Text und Wert für jede Option
            wohnungDropdown.appendChild(option);
        });

        handlePreselectedApartment(); // Wählt eine Wohnung voraus, falls eine ID vorhanden ist
    } catch (error) {
        console.error('Fehler beim Laden der Ferienwohnungen:', error);
    }
}

// Lädt Details einer Ferienwohnung basierend auf der ID aus der URL
async function loadWohnungDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const wohnungId = urlParams.get('id'); // Holt die ID der Wohnung aus der URL

    if (wohnungId) {
        try {
            const response = await fetch(`/api/ferienwohnungen/${wohnungId}`);
            const wohnung = await response.json();

            // Aktualisiert das Bild der Wohnung, falls vorhanden
            const wohnungBild = document.getElementById('wohnung-bild');
            wohnungBild.src = wohnung.bild ? '/' + wohnung.bild : 'img/placeholder.png';

            // Initialisiert die Karte mit den Koordinaten der Wohnung
            initializeMap(wohnung._id, wohnung.lat, wohnung.lng);
        } catch (error) {
            console.error('Error loading wohnung details:', error);
        }
    }
}

// Prüft, ob der Benutzer eingeloggt ist, indem auf den Authentifizierungstoken geprüft wird
function checkLoginStatus() {
    const authToken = localStorage.getItem('authToken'); // Holt den Token aus dem Local Storage
    return !!authToken; // Gibt true zurück, wenn ein Token vorhanden ist, andernfalls false
}

// Initialisiert die Karte für die Ferienwohnung basierend auf ihren Koordinaten
function initializeMap(id, lat, lng) {
    const mapContainer = document.getElementById('mapContainer'); // Holt den Map-Container
    if (mapContainer && lat && lng) {
        mapContainer.style.display = 'block'; // Zeigt den Kartencontainer an, wenn Koordinaten vorhanden sind

        const map = new google.maps.Map(mapContainer, {
            center: { lat: lat, lng: lng }, // Zentriert die Karte auf die übergebenen Koordinaten
            zoom: 12
        });

        new google.maps.Marker({
            position: { lat: lat, lng: lng }, // Setzt einen Marker auf der Karte
            map: map
        });
    }
}