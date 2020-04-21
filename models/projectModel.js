// projectModel.js
var mongoose = require('mongoose');
var productionSchema = require('./productionModel')
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
    country: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },

    height: {
        type: Number,
        required: true,
    },
    width: {
        type: Number,
        required: true,
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
    panel_number: {
        type: Number,
        required: true
    },
    install_date: {
        type:Date,
        default: Date.now
    },
    prod_today:[
        
        [productionSchema]
    
    ],
    next_prod:[
        
        [productionSchema]
        
    ],
    previous_prod:[
        
            [productionSchema]
        
    ],
    total_prod: {
        type: Number,
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    create_date: {
        type: Date,
        default: Date.now
    }

});
// Export Project model
var Project = module.exports = mongoose.model('Projects', projectSchema);