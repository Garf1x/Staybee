const mongoose = require('mongoose');

/**
 * Schema für Buchungen in der Datenbank.
 * 
 * @typedef {Object} BuchungSchema
 * @property {mongoose.Schema.Types.ObjectId} userId - Die ID des Benutzers, der die Buchung vorgenommen hat. Referenziert das 'Benutzer'-Schema.
 * @property {mongoose.Schema.Types.ObjectId} wohnungId - Die ID der Ferienwohnung, die gebucht wurde. Referenziert das 'Ferienwohnung'-Schema.
 * @property {Date} checkin - Das Check-in-Datum der Buchung.
 * @property {Date} checkout - Das Check-out-Datum der Buchung.
 * @property {Boolean} zustellbett - Gibt an, ob ein Zustellbett benötigt wird. Standardwert ist false.
 * @property {Boolean} kinderbett - Gibt an, ob ein Kinderbett benötigt wird. Standardwert ist false.
 * @property {Boolean} fruehstueck - Gibt an, ob Frühstück in der Buchung enthalten ist. Standardwert ist false.
 * @property {Boolean} parkplatz - Gibt an, ob ein Parkplatz benötigt wird. Standardwert ist false.
 */
const BuchungSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Benutzer',
        required: true
    },
    wohnungId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ferienwohnung',
        required: true
    },
    checkin: {
        type: Date,
        required: true
    },
    checkout: {
        type: Date,
        required: true
    },
    zustellbett: {
        type: Boolean,
        default: false
    },
    kinderbett: {
        type: Boolean,
        default: false
    },
    fruehstueck: {
        type: Boolean,
        default: false
    },
    parkplatz: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Buchung', BuchungSchema);