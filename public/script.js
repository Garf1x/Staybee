document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    // Initialize page-specific functionality
    if (page === 'ferienwohnungen') {
        loadFerienwohnungenFromDB();  // Load apartments from the database
        initializeSearchFunctionality();
        initializeMaps();  // Ensure maps are initialized
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
                                </div>
                            </div>
                        </a>
                    </div>
                `;
                container.innerHTML += card;
            });
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

function initMapsFerienwohnungen(ferienwohnungen) {
    ferienwohnungen.forEach(wohnung => {
        console.log('Initializing map for:', wohnung.name);
        
        if (wohnung.lat && wohnung.lng) {
            const mapContainer = document.getElementById(`map${wohnung._id}`);
            if (mapContainer) {
                console.log('Creating map for:', wohnung.name);
                const map = new google.maps.Map(mapContainer, {
                    center: { lat: parseFloat(wohnung.lat), lng: parseFloat(wohnung.lng) },
                    zoom: 12
                });
                new google.maps.Marker({
                    position: { lat: parseFloat(wohnung.lat), lng: parseFloat(wohnung.lng) },
                    map: map,
                    title: wohnung.name
                });
            } else {
                console.error('Map container not found for:', wohnung.name);
            }
        } else {
            console.error('Lat/Lng missing for:', wohnung.name);
        }
    });
}

// Initialize the map for the selected apartment on the booking page
function initMapBuchung(wohnung) {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer && wohnung.lat && wohnung.lng) {
        mapContainer.style.display = 'block'; // Show the map container

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

// Delete listing function
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

// Placeholder function for editing listing
window.editInserat = function(id) {
    alert(`Inserat ${id} bearbeiten`);  // Placeholder: Implement editing functionality here
}

// Handle authentication and navigation visibility
document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const adminNav = document.getElementById('adminNav');

    // Check if authentication token exists
    if (authToken) {
        loginNav.style.display = 'none';
        logoutNav.style.display = 'block';

        // Show admin link if user is admin
        if (userRole === 'admin') {
            adminNav.style.display = 'block';
        }
    } else {
        loginNav.style.display = 'block';
        logoutNav.style.display = 'none';
        adminNav.style.display = 'none'; // Hide admin link if not logged in
    }

    // Logout event
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
        });
    }
});

// Add and submit new listing
document.addEventListener('DOMContentLoaded', () => {
    const inseratForm = document.getElementById('inseratForm');

    // Event listener for adding new listings
    if (inseratForm) {
        inseratForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const formData = new FormData(inseratForm); // Use FormData to handle file upload

            fetch('/api/ferienwohnungen', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData // Send form data including the file
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
    }
});

// Fetch the Google Maps API key and load the script
fetch('/api/google-maps-key')
    .then(response => response.json())
    .then(data => {
        console.log('Google Maps API Key:', data.apiKey);
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
        loadFerienwohnungenFromDB();  // Ensure this function loads the apartments and initializes maps
    } else {
        console.error('initMapsFerienwohnungen function not found.');
    }
}

function handlePreselectedApartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedWohnungId = urlParams.get('id');
    if (selectedWohnungId) {
        document.getElementById('wohnungDropdown').value = selectedWohnungId;
        updateWohnungDetails(selectedWohnungId);  // Show details of the selected apartment
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
    })
    .catch(error => console.error('Fehler beim Laden der Ferienwohnung:', error));
}


function initMapsFerienwohnungen(ferienwohnungen) {
    ferienwohnungen.forEach(wohnung => {
        console.log('Initializing map for:', wohnung.name);
        
        if (wohnung.lat && wohnung.lng) {
            const mapContainer = document.getElementById(`map${wohnung._id}`);
            if (mapContainer) {
                console.log('Creating map for:', wohnung.name);
                const map = new google.maps.Map(mapContainer, {
                    center: { lat: parseFloat(wohnung.lat), lng: parseFloat(wohnung.lng) },
                    zoom: 12
                });
                new google.maps.Marker({
                    position: { lat: parseFloat(wohnung.lat), lng: parseFloat(wohnung.lng) },
                    map: map,
                    title: wohnung.name
                });
            } else {
                console.error('Map container not found for:', wohnung.name);
            }
        } else {
            console.error('Lat/Lng missing for:', wohnung.name);
        }
    });
}

function initMap() {
    // This function will be called automatically by the Google Maps API script
}

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');

    // Initialize page-specific functionality
    if (page === 'ferienwohnungen') {
        loadFerienwohnungenFromDB();  // Load apartments from the database
        initializeSearchFunctionality();
    } else if (page === 'buchung') {
        loadFerienwohnungenForBooking();  // Load apartments for booking
        handlePreselectedApartment();  // Check for pre-selected apartment
        setMinDateForBooking();
        document.getElementById('wohnungDropdown').addEventListener('change', function() {
            const wohnungId = this.value;
            updateWohnungDetails(wohnungId);
        });
    } else if (page === 'inserate-bearbeiten') {
        loadInserateVerwaltung();  // Load listings for admins
    }
});

// Function to load apartments into the dropdown on the booking page
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

// Function to handle the preselected apartment on the booking page
function handlePreselectedApartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedWohnungId = urlParams.get('id');  // Get apartment ID from URL

    if (selectedWohnungId) {
        const wohnungDropdown = document.getElementById('wohnungDropdown');

        // Wait until apartments are loaded into the dropdown
        setTimeout(() => {
            wohnungDropdown.value = selectedWohnungId;  // Pre-select apartment in dropdown
            updateWohnungDetails(selectedWohnungId);  // Update apartment details
        }, 500);  // Slight delay to ensure dropdown is populated
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
        })
        .catch(error => console.error('Fehler beim Laden der Ferienwohnung:', error));
}

// Set the minimum date to today for the check-in and check-out fields
function setMinDateForBooking() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkin').setAttribute('min', today);
    document.getElementById('checkout').setAttribute('min', today);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message; // Set the message for the toast
    toast.className = "toast show"; // Add 'show' class to display the toast

    // Hide the toast after 3 seconds
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Simulate login success
    if (email === 'test@gmail.com' && password === '1234') {
        showToast("Login erfolgreich!");
        // Proceed with redirect or other logic after login success
    } else {
        showToast("Login fehlgeschlagen! Bitte versuchen Sie es erneut.");
    }
});

