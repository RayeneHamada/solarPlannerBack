const geolib = require('geolib'),
     pvtools = require("pvtools"),
     axios = require('axios').default,
     
     mongoose  = require('mongoose'),
     Project = mongoose.model('Project');


/*takes a location and returns satellite derived observations ("estimated actuals") 
for a specific location and PV system parameters.*/

//main function
exports.test = function (req, res) {
    var area = [];
    var bounds = [];
    var longueur, largeur;
    var rawDim = 2;
    var cellDim = 1;
    var rowInc;
    var columnInc;
    var cells = new Array();
   
    for (let i = 0; i < req.body.points.length; i++) {
        let y = Number(req.body.points[i].lat),
            x = Number(req.body.points[i].lon);
        area.push({ latitude: y, longitude: x });
    }
    console.log(area);
    if(area[2]!=null)
    {
    bounds = pvtools.getBounds(area);

    longueur = pvtools.getDistance(
        { lat: bounds.minLat, lon: bounds.maxLng },
        { lat: bounds.maxLat, lon: bounds.maxLng }
    );

    largeur = pvtools.getDistance(
        { lat: bounds.minLat, lon: bounds.maxLng },
        { lat: bounds.minLat, lon: bounds.minLng }
    );

    rowInc = bounds.maxLat - geolib.computeDestinationPoint({ latitude: bounds.maxLat, longitude: bounds.minLng }, 3, 180).latitude;
    
    columnInc = geolib.computeDestinationPoint({ latitude: bounds.maxLat, longitude: bounds.minLng }, 2, 90).longitude - bounds.minLng;
    
    var inc = 0;
    for (let i = bounds.maxLat; i > bounds.minLat; i -= rowInc) {
     

        for (let j = bounds.minLng; j < bounds.maxLng; j += columnInc) {

          
            if (pvtools.pointInArea({ lat: i, lon: j }, area)) {

                if (pvtools.pointInArea({ lat: i, lon: j + columnInc }, area)) {
                    if (pvtools.pointInArea({ lat: Number(i - rowInc), lon: Number(j + columnInc) }, area)) {

                        if (pvtools.pointInArea({ lat: Number(i - rowInc), lon: Number(j) }, area)) {
                            var cell = new Array();
                            cell.push(
                                geolib.getCenterOfBounds([
                                { latitude: i, longitude: j },
                                { latitude: i, longitude: Number(j + columnInc) },
                                { latitude: Number(i + rowInc), longitude: Number(j + columnInc) },
                                { latitude: Number(i + rowInc), longitude: j },
                            ]));

                            cells.push(cell);
                            inc++;
                        }
                    }
                }
                
            }
        }
    }
    

    var data = [];
   /* p.estimated_actuals.foreach((x) => {
        data.push([x.pv_estimate, new Date(x.period_end).getTime()]);
    })*/
    // res.json({ "bounds": bounds, "longueur": longueur, "largeur": largeur,"rawinc":rawInc,"colinc":columnInc,"number of cells":inc,"cells":cells});
    let c =  new Project({
        area: req.body.points,
        lat:0,
        long:0,
        tilt:0,
        direction:'north',
        panels: inc
    });
    c.save().then(() => {


        res.status(200).send(c);

    }).catch((err) => {
        res.status(400).send({
            message: "erreur : " + err
        })
    });
    return true;
    }
    res.json({"numberofpanels": 0});
    
};

exports.estimation = function(lat,long)
{
    console.log("ahla");
    axios.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(lat) + "&longitude=" + Number(long) + "&capacity=1&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json")
    .then(function (response) {
      // handle success
      console.log(response.data);
    })
    .catch(function (error) {
      // handle error
      //console.log(error);
    })
    .finally(function () {
      // always executed
    });

    
    
}
