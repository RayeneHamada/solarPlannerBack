// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var projectSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    area: [{
        lat: Number,
        lon: Number
    }],
    lat: {
        type: Number,
        required: true
    },
    lon: {
        type: Number,
        required: true
    },
    surface: {
        type: Number,
        required: true
    },
    panel: {
        height:Number,
        width:Number,
        capacity:Number
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
    panel_number: {
        type: Number,
        required: true
    },
    install_date: {
        type:Date,
        default: Date.now
    },
    create_date: {
        type: Date,
        default: Date.now
    }

});
// Export Project model
var Project = module.exports = mongoose.model('Projects', projectSchema);