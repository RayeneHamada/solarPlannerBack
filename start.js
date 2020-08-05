const app = require('./index.js')
let port = process.env.PORT;
app.listen(port, function (req, res) {
    console.log("it works");
})