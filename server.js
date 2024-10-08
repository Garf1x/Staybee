const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // To handle file uploads
const path = require('path'); // For serving static files
require('dotenv').config(); // Load environment variables

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Static files (CSS, JS, Images, HTML)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('Fehler bei der MongoDB-Verbindung:', err));

// Multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// User schema
const BenutzerSchema = new mongoose.Schema({
  name: String,
  email: String,
  kennwort: String,
  rolle: { type: String, default: 'user' } // Default role is 'user'
});
const Benutzer = mongoose.model('Benutzer', BenutzerSchema);

// Apartment schema
const FerienwohnungSchema = new mongoose.Schema({
  name: String,
  ort: String,
  beschreibung: String,
  preis: Number,
  verfuegbarkeit: Boolean,
  bild: String, // Path to uploaded image
  lat: Number,
  lng: Number
});
const Ferienwohnung = mongoose.model('Ferienwohnung', FerienwohnungSchema);

// Route: Register user
app.post('/register', async (req, res) => {
  const { name, email, kennwort } = req.body;
  const hashedPassword = await bcrypt.hash(kennwort, 10);
  const newUser = new Benutzer({ name, email, kennwort: hashedPassword });
  await newUser.save();
  res.status(201).send("Registrierung erfolgreich");
});

// Route: Login user
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

// Middleware: Authentication check
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

// Middleware: Admin check
function adminMiddleware(req, res, next) {
  if (req.user.rolle !== 'admin') return res.status(403).send('Nur Admins dürfen diese Aktion ausführen');
  next();
}

// Route: Fetch all apartments (no authentication needed)
app.get('/api/ferienwohnungen', async (req, res) => {
  try {
    const apartments = await Ferienwohnung.find();
    res.json(apartments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route: Add new apartment (Admin only)
app.post('/api/ferienwohnungen', authMiddleware, adminMiddleware, upload.single('bild'), async (req, res) => {
  const { name, ort, beschreibung, preis, lat, lng } = req.body;
  const bild = req.file ? req.file.path : null; // Handle image file if uploaded
  const newApartment = new Ferienwohnung({ name, ort, beschreibung, preis, verfuegbarkeit: true, lat, lng, bild });
  
  try {
    const savedApartment = await newApartment.save();
    res.status(201).json(savedApartment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route: Edit apartment (Admin only)
app.patch('/api/ferienwohnungen/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const apartment = await Ferienwohnung.findById(req.params.id);
    if (!apartment) return res.status(404).json({ message: 'Ferienwohnung nicht gefunden' });

    // Update apartment fields
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

// Route: Delete apartment (Admin only)
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

// Serve HTML files
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

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
