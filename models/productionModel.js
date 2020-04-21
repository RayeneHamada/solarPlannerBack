var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var productionSchema = new Schema({

    date_time: {
        type: Date,
        required: true,
    },
    pv: {
        type: Number,
        required: true,
    }
    

});
// Export Project model
module.exports = productionSchema;