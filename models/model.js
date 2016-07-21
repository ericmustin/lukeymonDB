var db = require('../database/dbConfig.js');

var mongoose = require('mongoose');

//some properties here aren't used in production at the moment such as pressure
var tradeSchema = new mongoose.Schema({
    day: String,
    symbol: String,
    expiration: String,
    strike: Number,
    price: Number,
    type: String,
    size: Number,
    id: Number
});

var Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;
