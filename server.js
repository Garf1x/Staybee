const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Buchung = require('./models/buchung'); // Korrigiere den Pfad
const multer = require('multer'); // Handling file uploads
const path = require('path'); // To serve static files
const fetch = require('node-fetch'); // To make API requests
require('dotenv').config(); // Load environment variables

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('Fehler bei der MongoDB-Verbindung:', err));

// Function to normalize file paths
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/'); // Replace backslashes with forward slashes
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set upload destination
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Rename files with timestamp
  }
});
const upload = multer({ storage: storage });

// User schema
const BenutzerSchema = new mongoose.Schema({
  name: String,
  email: String,
  kennwort: String,
  rolle: { type: String, default: 'user' } // Default to 'user'
});
const Benutzer = mongoose.model('Benutzer', BenutzerSchema);

// Apartment schema
const FerienwohnungSchema = new mongoose.Schema({
  name: String,
  ort: String,
  adresse: String, // New field for address
  beschreibung: String,
  preis: Number,
  verfuegbarkeit: Boolean,
  bild: String, // Store image path
  lat: Number,
  lng: Number
});
const Ferienwohnung = mongoose.model('Ferienwohnung', FerienwohnungSchema);

// Register route
app.post('/register', async (req, res) => {
  const { name, email, kennwort } = req.body;
  const hashedPassword = await bcrypt.hash(kennwort, 10);
  const newUser = new Benutzer({ name, email, kennwort: hashedPassword });
  await newUser.save();
  res.status(201).send("Registrierung erfolgreich");
});

// Login route
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

// Middleware for authentication check
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

// Middleware for admin check
function adminMiddleware(req, res, next) {
  if (req.user.rolle !== 'admin') return res.status(403).send('Nur Admins dürfen diese Aktion ausführen');
  next();
}

// Route to get user profile
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

// Function to geocode address and get latitude and longitude
async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('Geocoded address:', location); // Log the location to confirm it's correct
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

// Route to get all apartments
app.get('/api/ferienwohnungen', async (req, res) => {
  try {
    const apartments = await Ferienwohnung.find();

    // Normalize the image paths before sending the response
    apartments.forEach(apartment => {
      if (apartment.bild) {
        apartment.bild = normalizePath(apartment.bild); // Ensure all backslashes are replaced
      }
    });

    res.json(apartments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to get a specific apartment by ID
app.get('/api/ferienwohnungen/:id', async (req, res) => {
    try {
        const wohnung = await Ferienwohnung.findById(req.params.id);
        res.json(wohnung);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Ferienwohnung' });
    }
});

// Route to add new apartment (Admin only)
app.post('/api/ferienwohnungen', authMiddleware, adminMiddleware, upload.single('bild'), async (req, res) => {
  const { name, ort, address, beschreibung, preis } = req.body; // Ändern Sie 'adresse' zu 'address'
  const bild = req.file ? normalizePath(req.file.path) : null;

  // Log the entire request body to debug the issue
  console.log('Request body:', req.body);

  try {
    // Log the address to be geocoded
    console.log('Geocoding address:', address); // Ändern Sie 'adresse' zu 'address'

    // Geocode the address to get lat and lng
    const { lat, lng } = await geocodeAddress(address); // Ändern Sie 'adresse' zu 'address'

    const newApartment = new Ferienwohnung({ name, ort, adresse: address, beschreibung, preis, verfuegbarkeit: true, lat, lng, bild });
    const savedApartment = await newApartment.save();
    res.status(201).json(savedApartment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Fehler beim Hinzufügen der Ferienwohnung' });
  }
});

// Edit apartment route (Admin only)
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

// Delete apartment route (Admin only)
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

// Route for Google Maps API Key
app.get('/api/google-maps-key', (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// Serve HTML pages
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

// Serve the map page
app.get('/map.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

// Route to create a new booking
app.post('/api/buchungen', authMiddleware, async (req, res) => {
  try {
    const { wohnungId, checkin, checkout, zustellbett, kinderbett, fruehstueck, parkplatz } = req.body;
    const userId = req.user.userId; // Extract userId from authenticated user

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

// Route to get user bookings
app.get('/api/buchungen', authMiddleware, async (req, res) => {
  try {
      const buchungen = await Buchung.find({ userId: req.user.userId }).populate('wohnungId');
      console.log('Buchungen aus der Datenbank:', buchungen); // Debug: Überprüfe die abgerufenen Buchungen
      res.json(buchungen);
  } catch (error) {
      res.status(500).json({ message: 'Fehler beim Abrufen der Buchungen' });
  }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

module.exports = router;