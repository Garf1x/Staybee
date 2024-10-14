const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Buchung = require('./models/buchung'); 
const multer = require('multer'); // Zum Hochladen von Dateien
const path = require('path'); // Zum Bereitstellen von statischen Dateien
const fetch = require('node-fetch'); // Zum Ausführen von API-Anfragen
require('dotenv').config(); // Lädt Umgebungsvariablen

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Statische Dateien bereitstellen (CSS, JS, Bilder)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads')); // Bereitstellen von hochgeladenen Bildern

// Verbindung zu MongoDB herstellen
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('Fehler bei der MongoDB-Verbindung:', err));

// Funktion zum Normalisieren von Dateipfaden
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/'); // Ersetzt Backslashes durch Slashes
}

// Konfiguration von multer für das Hochladen von Bildern
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Zielverzeichnis für Uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Dateien mit Zeitstempel umbenennen
  }
});
const upload = multer({ storage: storage });

// Benutzerschema
const BenutzerSchema = new mongoose.Schema({
  name: String,
  email: String,
  kennwort: String,
  rolle: { type: String, default: 'user' } // Standardmäßig 'user'
});
const Benutzer = mongoose.model('Benutzer', BenutzerSchema);

// Ferienwohnungsschema
const FerienwohnungSchema = new mongoose.Schema({
  name: String,
  ort: String,
  adresse: String, // Neues Feld für Adresse
  beschreibung: String,
  preis: Number,
  verfuegbarkeit: Boolean,
  bild: String, // Bildpfad speichern
  lat: Number,
  lng: Number
});
const Ferienwohnung = mongoose.model('Ferienwohnung', FerienwohnungSchema);

// Registrierungsroute
app.post('/register', async (req, res) => {
  const { name, email, kennwort } = req.body;
  const hashedPassword = await bcrypt.hash(kennwort, 10);
  const newUser = new Benutzer({ name, email, kennwort: hashedPassword });
  await newUser.save();
  res.status(201).send("Registrierung erfolgreich");
});

// Login-Route
app.post('/login', async (req, res) => {
  const { email, kennwort } = req.body;
  const user = await Benutzer.findOne({ email });

  if (user && await bcrypt.compare(kennwort, user.kennwort)) {
    const token = jwt.sign({ userId: user._id, rolle: user.rolle }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: "Login erfolgreich", token, rolle: user.rolle });
  } else {
    res.status(401).send("Ungültige Anmeldeinformationen");
  }
});

// Middleware zur Authentifizierungsprüfung
function authMiddleware(req, res, next) {
  const token = req.header('Authorization').replace('Bearer ', '');
  console.log('Token:', token); // Debug: Überprüfe den Token
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded User:', decoded); // Debug: Überprüfe den dekodierten Benutzer
      req.user = decoded;
      next();
  } catch (error) {
      res.status(401).json({ message: 'Nicht autorisiert' });
  }
}

// Middleware zur Admin-Prüfung
function adminMiddleware(req, res, next) {
  if (req.user.rolle !== 'admin') return res.status(403).send('Nur Admins dürfen diese Aktion ausführen');
  next();
}

// Route zum Abrufen des Benutzerprofils
app.get('/api/profil', authMiddleware, (req, res) => {
  Benutzer.findById(req.user.userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' });
      }
      res.json({ name: user.name, email: user.email });
    })
    .catch(err => res.status(500).json({ message: 'Serverfehler' }));
});

// Funktion zur Geokodierung von Adressen
async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('Geocoded address:', location); // Logge die Location zur Überprüfung
      return { lat: location.lat, lng: location.lng };
    } else {
      console.error(`Geocoding failed: ${data.status} - ${data.error_message}`);
      throw new Error(`Geocoding failed: ${data.status} - ${data.error_message}`);
    }
  } catch (error) {
    console.error('Error fetching Geocoding data:', error);
    throw new Error('Failed to geocode address');
  }
}

// Route zum Abrufen aller Ferienwohnungen
app.get('/api/ferienwohnungen', async (req, res) => {
  try {
    const apartments = await Ferienwohnung.find();

    // Normalisiere die Bildpfade vor dem Senden der Antwort
    apartments.forEach(apartment => {
      if (apartment.bild) {
        apartment.bild = normalizePath(apartment.bild); // Ersetze Backslashes
      }
    });

    res.json(apartments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route zum Abrufen einer spezifischen Ferienwohnung nach ID
app.get('/api/ferienwohnungen/:id', async (req, res) => {
    try {
        const wohnung = await Ferienwohnung.findById(req.params.id);
        res.json(wohnung);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Ferienwohnung' });
    }
});

// Route zum Hinzufügen einer neuen Ferienwohnung (nur Admin)
app.post('/api/ferienwohnungen', authMiddleware, adminMiddleware, upload.single('bild'), async (req, res) => {
  const { name, ort, address, beschreibung, preis } = req.body; 
  const bild = req.file ? normalizePath(req.file.path) : null;

  // Logge den gesamten Request-Body zur Fehlerbehebung
  console.log('Request body:', req.body);

  try {
    // Logge die zu geokodierende Adresse
    console.log('Geocoding address:', address); 

    // Geokodiere die Adresse, um lat und lng zu erhalten
    const { lat, lng } = await geocodeAddress(address); 

    const newApartment = new Ferienwohnung({ name, ort, adresse: address, beschreibung, preis, verfuegbarkeit: true, lat, lng, bild });
    const savedApartment = await newApartment.save();
    res.status(201).json(savedApartment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Fehler beim Hinzufügen der Ferienwohnung' });
  }
});

// Route zum Bearbeiten einer Ferienwohnung (nur Admin)
app.patch('/api/ferienwohnungen/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const apartment = await Ferienwohnung.findById(req.params.id);
    if (!apartment) return res.status(404).json({ message: 'Ferienwohnung nicht gefunden' });

    if (req.body.name != null) apartment.name = req.body.name;
    if (req.body.ort != null) apartment.ort = req.body.ort;
    if (req.body.beschreibung != null) apartment.beschreibung = req.body.beschreibung;
    if (req.body.preis != null) apartment.preis = req.body.preis;
    if (req.body.verfuegbarkeit != null) apartment.verfuegbarkeit = req.body.verfuegbarkeit;

    const updatedApartment = await apartment.save();
    res.json(updatedApartment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route zum Löschen einer Ferienwohnung (nur Admin)
app.delete('/api/ferienwohnungen/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const apartment = await Ferienwohnung.findById(req.params.id);
    if (!apartment) return res.status(404).json({ message: 'Ferienwohnung nicht gefunden' });

    await apartment.remove();
    res.json({ message: 'Ferienwohnung gelöscht' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route für den Google Maps API-Schlüssel
app.get('/api/google-maps-key', (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// HTML-Seiten bereitstellen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/ferienwohnungen', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ferienwohnungen.html'));
});

app.get('/buchung.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'buchung.html'));
});

app.get('/inserate-bearbeiten.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inserate-bearbeiten.html'));
});

// Karte-Seite bereitstellen
app.get('/map.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

// Route zum Erstellen einer neuen Buchung
app.post('/api/buchungen', authMiddleware, async (req, res) => {
  try {
    const { wohnungId, checkin, checkout, zustellbett, kinderbett, fruehstueck, parkplatz } = req.body;
    const userId = req.user.userId; // Extrahiere userId vom authentifizierten Benutzer

    // Überprüfe, ob die wohnungId gültig ist
    const wohnung = await Ferienwohnung.findById(wohnungId);
    if (!wohnung) {
      return res.status(400).json({ message: 'Ungültige wohnungId' });
    }

    const newBuchung = new Buchung({
      userId,
      wohnungId,
      checkin,
      checkout,
      zustellbett,
      kinderbett,
      fruehstueck,
      parkplatz
    });

    await newBuchung.save();
    res.status(201).json({ message: 'Buchung erfolgreich erstellt', buchung: newBuchung });
  } catch (error) {
    console.error('Fehler bei der Buchung:', error);
    res.status(500).json({ message: 'Fehler bei der Buchung', error });
  }
});

// Route zum Abrufen der Buchungen eines Benutzers
app.get('/api/buchungen', authMiddleware, async (req, res) => {
  try {
      const buchungen = await Buchung.find({ userId: req.user.userId }).populate('wohnungId');
      console.log('Buchungen aus der Datenbank:', buchungen); // Debug: Überprüfe die abgerufenen Buchungen
      res.json(buchungen);
  } catch (error) {
      res.status(500).json({ message: 'Fehler beim Abrufen der Buchungen' });
  }
});

// Server starten
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

module.exports = router;