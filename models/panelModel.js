// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var panelSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    technology:{
        type: String,
        enum: ['Monocrystalline','Polycrystalline','Thin film'],
        required: true
    },
    type:{
        type: String,
        enum: ['global', 'personal'],
        required: true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },
    
});
// Export Panel model
var Panel = module.exports = mongoose.model('Panels', panelSchema);