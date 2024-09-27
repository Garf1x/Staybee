const mongoose = require('mongoose');

// Definiere das Schema für Ferienwohnungen
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
    }
});

module.exports = mongoose.model('Ferienwohnung', FerienwohnungSchema);
