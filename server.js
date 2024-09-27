const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config(); // Umgebungsvariablen aus .env-Datei laden

console.log('MONGO_URI:', process.env.MONGO_URI); // Test: Zeigt den MONGO_URI in der Konsole an

// Express-App initialisieren
const app = express();

// Body-Parser Middleware
app.use(bodyParser.json());

// Verbindung zu MongoDB herstellen
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('Fehler bei der MongoDB-Verbindung:', err));



  const Ferienwohnung = mongoose.model('Ferienwohnung', new mongoose.Schema({
    name: String,
    ort: String,
    beschreibung: String,
    preis: Number,
    verfuegbarkeit: Boolean

  }));

// Beispielroute
app.get('/', (req, res) => {
  res.send('Willkommen bei der Ferienhausplattform!');
});

// Server starten
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

const cors = require('cors');
app.use(cors());

// Route: Alle Ferienwohnungen anzeigen
app.get('/ferienwohnungen', async (req, res) => {
  try {
      const ferienwohnungen = await Ferienwohnung.find();
      res.json(ferienwohnungen);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

app.post('/ferienwohnungen', async (req, res) => {
  console.log('POST-Anfrage empfangen:', req.body); // Debugging-Ausgabe
  const ferienwohnung = new Ferienwohnung({
      name: req.body.name,
      ort: req.body.ort,
      beschreibung: req.body.beschreibung,
      preis: req.body.preis,
      verfuegbarkeit: req.body.verfuegbarkeit
  });

  try {
      const neueFerienwohnung = await ferienwohnung.save();
      res.status(201).json(neueFerienwohnung);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});

app.patch('/ferienwohnungen/:id', async (req, res) => {
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
app.delete('/ferienwohnungen/:id', async (req, res) => {
  try {
      const ferienwohnung = await Ferienwohnung.findById(req.params.id);
      if (!ferienwohnung) return res.status(404).json({ message: 'Ferienwohnung nicht gefunden' });

      await ferienwohnung.remove();
      res.json({ message: 'Ferienwohnung gelöscht' });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});
