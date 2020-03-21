const mongoose = require('mongoose');

mongoose
.connect("mongodb+srv://Rayene:tfg@tfgcluster-ij9xn.mongodb.net/tfg?retryWrites=true&w=majority", {
useUnifiedTopology: true,
useNewUrlParser: true,
})
.then(() => console.log('DB Connected!'))
.catch(err => {
console.log('DB Connection Error: ${err.message}'+err.message);
});
mongoose.set('useCreateIndex', true);
module.exports={mongoose};
