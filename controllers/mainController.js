const geolib = require('geolib'),
    Request = require("request"),
    pvtools = require("pvtools");
/*takes a location and returns satellite derived observations ("estimated actuals") 
for a specific location and PV system parameters.*/

function getPower(lat, long)
{
    var p;
    Request.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(lat) + "&longitude=" + Number(long) + "&capacity=1&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json", (error, response, body) => {
        if (error) {
            return console.dir(error);
        }
        p = response.body;
        console.log(p);
    });
    return p;
}

function getRawSpace(panelLength,panelInclination)
{

}

//main function
exports.test = function (req, res) {
    var area = [];
    var bounds = [];
    var longueur, largeur;
    var rawDim = 2;
    var cellDim = 1;
    var rowInc;
    var columnInc;
   // console.log(req.body);
    var cells = new Array();
    for (let i = 0; i < req.body.points.length; i++) {
        let y = Number(req.body.points[i].lat),
            x = Number(req.body.points[i].lon);
        area.push({ latitude: y, longitude: x });
    }
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
    var p;
    p = getPower(cells[0][0].latitude, cells[0][0].longitude);
    

    var data = [];
   /* p.estimated_actuals.foreach((x) => {
        data.push([x.pv_estimate, new Date(x.period_end).getTime()]);
    })*/
    // res.json({ "bounds": bounds, "longueur": longueur, "largeur": largeur,"rawinc":rawInc,"colinc":columnInc,"number of cells":inc,"cells":cells});
    res.json({ "numberofpanels": inc, "estimations": p });
};