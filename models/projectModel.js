// projectModel.js
var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    area: [{
        lat: Number,
        long: Number
    }],
    lat: {
        type: Number,
        required: true
    },
    lon: {
        type: Number,
        required: true
    },
    tilt: {
        type: Number,
        required: true
    },
    direction: {
        type: String,
        required: true
    },
    azimuth: {
        type: Number,
    },
    zenith: {
        type: Number,
    },
    panels:{
        type: Number,
        required: true
    },
    create_date: {
        type: Date,
        default: Date.now
    }


});
// Export Project model
var Project = module.exports = mongoose.model('Projects', projectSchema);
