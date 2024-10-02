const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path'); // Path-Modul zum Ausliefern von HTML-Dateien
require('dotenv').config(); // Umgebungsvariablen aus .env-Datei laden

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Statische Dateien ausliefern (CSS, JS, Bilder, HTML)
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('Fehler bei der MongoDB-Verbindung:', err));

const BenutzerSchema = new mongoose.Schema({
  name: String,
  email: String,
  kennwort: String,
  rolle: { type: String, default: 'user' } // Standardmäßig Benutzer, Admin manuell hinzufügen
});
const Benutzer = mongoose.model('Benutzer', BenutzerSchema);

const FerienwohnungSchema = new mongoose.Schema({
  name: String,
  ort: String,
  beschreibung: String,
  preis: Number,
  verfuegbarkeit: Boolean
});
const Ferienwohnung = mongoose.model('Ferienwohnung', FerienwohnungSchema);

// Route: Benutzer registrieren
app.post('/register', async (req, res) => {
  const { name, email, kennwort } = req.body;
  const verschluesseltesKennwort = await bcrypt.hash(kennwort, 10);
  const neuerBenutzer = new Benutzer({ name, email, kennwort: verschluesseltesKennwort });
  await neuerBenutzer.save();
  res.status(201).send("Registrierung erfolgreich");
});

// Route: Benutzer anmelden
app.post('/login', async (req, res) => {
  const { email, kennwort } = req.body;
  const benutzer = await Benutzer.findOne({ email });
  
  if (benutzer && await bcrypt.compare(kennwort, benutzer.kennwort)) {
    const token = jwt.sign({ userId: benutzer._id, rolle: benutzer.rolle }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: "Login erfolgreich", token, rolle: benutzer.rolle });
  } else {
    res.status(401).send("Ungültige Anmeldeinformationen");
  }
});

// Middleware: Authentifizierung prüfen
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

// Middleware: Admin prüfen
function adminMiddleware(req, res, next) {
  if (req.user.rolle !== 'admin') return res.status(403).send('Nur Admins dürfen diese Aktion ausführen');
  next();
}

// Route: Alle Ferienwohnungen anzeigen (ohne Authentifizierung)
app.get('/api/ferienwohnungen', async (req, res) => {
  try {
      const ferienwohnungen = await Ferienwohnung.find();
      res.json(ferienwohnungen);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


// Route: Neues Inserat (Ferienwohnung) hinzufügen (nur Admins)
app.post('/api/ferienwohnungen', authMiddleware, adminMiddleware, async (req, res) => {
  const ferienwohnung = new Ferienwohnung(req.body);
  try {
    const neueFerienwohnung = await ferienwohnung.save();
    res.status(201).json(neueFerienwohnung);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route: Inserat (Ferienwohnung) bearbeiten (nur Admins)
app.patch('/api/ferienwohnungen/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ferienwohnung = await Ferienwohnung.findById(req.params.id);
    if (!ferienwohnung) return res.status(404).json({ message: 'Ferienwohnung nicht gefunden' });

    if (req.body.name != null) ferienwohnung.name = req.body.name;
    if (req.body.ort != null) ferienwohnung.ort = req.body.ort;
    if (req.body.beschreibung != null) ferienwohnung.beschreibung = req.body.beschreibung;
    if (req.body.preis != null) ferienwohnung.preis = req.body.preis;
    if (req.body.verfuegbarkeit != null) ferienwohnung.verfuegbarkeit = req.body.verfuegbarkeit;

    const aktualisierteFerienwohnung = await ferienwohnung.save();
    res.json(aktualisierteFerienwohnung);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route: Inserat (Ferienwohnung) löschen (nur Admins)
app.delete('/api/ferienwohnungen/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ferienwohnung = await Ferienwohnung.findById(req.params.id);
    if (!ferienwohnung) return res.status(404).json({ message: 'Ferienwohnung nicht gefunden' });

    await ferienwohnung.remove();
    res.json({ message: 'Ferienwohnung gelöscht' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route für die Startseite (index.html ausliefern)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Weitere HTML-Seiten ausliefern
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

// Route: Ferienwohnung hinzufügen (nur Admins)
app.post('/api/ferienwohnungen', authMiddleware, adminMiddleware, async (req, res) => {
  const ferienwohnung = new Ferienwohnung(req.body);
  try {
      const neueFerienwohnung = await ferienwohnung.save();
      res.status(201).json(neueFerienwohnung);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});


// Server starten
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
