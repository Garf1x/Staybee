const mongoose = require('mongoose');

// Definiere das Schema für Ferienwohnungen
/**
 * Schema für Ferienwohnung.
 * 
 * @typedef {Object} FerienwohnungSchema
 * @property {string} name - Der Name der Ferienwohnung. Erforderlich.
 * @property {string} ort - Der Ort der Ferienwohnung. Erforderlich.
 * @property {string} beschreibung - Eine Beschreibung der Ferienwohnung. Erforderlich.
 * @property {number} preis - Der Preis der Ferienwohnung. Erforderlich.
 * @property {boolean} [verfuegbarkeit=true] - Die Verfügbarkeit der Ferienwohnung. Standardmäßig auf true gesetzt.
 * @property {string} [bild] - Der Pfad zum Bild der Ferienwohnung. Optional.
 * @property {number} [lat] - Die Breite der Ferienwohnung. Optional.
 * @property {number} [lng] - Die Länge der Ferienwohnung. Optional.
 */
const FerienwohnungSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    ort: {
        type: String,
        required: true
    },
    beschreibung: {
        type: String,
        required: true
    },
    preis: {
        type: Number,
        required: true
    },
    verfuegbarkeit: {
        type: Boolean,
        default: true
    },
    bild: {
        type: String, 
        required: false
    },
    lat: Number,
    lng: Number
});

module.exports = mongoose.model('Ferienwohnung', FerienwohnungSchema);
