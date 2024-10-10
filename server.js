const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Zugriff verweigert');
  try {
    const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Ungültiges Token');
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

// Route to add new apartment (Admin only)
app.post('/api/ferienwohnungen', authMiddleware, adminMiddleware, upload.single('bild'), async (req, res) => {
  const { name, ort, adresse, beschreibung, preis } = req.body;
  const bild = req.file ? normalizePath(req.file.path) : null;

  try {
    // Geocode the address to get lat and lng
    const { lat, lng } = await geocodeAddress(adresse);

    const newApartment = new Ferienwohnung({ name, ort, adresse, beschreibung, preis, verfuegbarkeit: true, lat, lng, bild });
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

app.get('/ferienwohnungen.html', (req, res) => {
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

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
