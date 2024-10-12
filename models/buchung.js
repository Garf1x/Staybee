const mongoose = require('mongoose');

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