const geolib = require('geolib'),
     pvtools = require("pvtools"),
     axios = require('axios').default,

     mongoose  = require('mongoose'),
     Project = mongoose.model('Projects');


/*takes a location and returns satellite derived observations ("estimated actuals") 
for a specific location and PV system parameters.*/

//main function
exports.test = function (req, res) {
    console.log("you've called the backend");
    //Array containing the coins of the area
    var area = [];
    //Array containing the bounds of the area (maxLat,minLat,maxLon,minLon)
    var bounds = [];
    //height and width of the area
    var longueur, largeur;
    //Raw spacing
    const rawDim = 2;
    //Length of the panel
    var cellDim = 1;
    //geo increment of the rows
    var rowInc;
    //geo increment of the columns
    var columnInc;
    //Array containing the 4 geopoints of the solar panel
    var cells = new Array();
    //The number of the panels
    var inc = 0;   
    // center of the project
    var center;
    // Direction of the solar panels;
    var direction;
    //Surface area
    var surface;
    //loop to fill area with the data from the request
    for (let i = 0; i < req.body.points.length; i++) {
        let y = Number(req.body.points[i].lat),
            x = Number(req.body.points[i].lon);
        area.push({ latitude: y, longitude: x });
    }
    //calculate the center of the area
    center = geolib.getCenter(area);
    //calculate the surface of the area
    surface = geolib.getAreaOfPolygon(area);
    //find the direction of the solar panels
    if(center.latitude<0)
        {direction = "South";}
    else
        {direction = "north";}
    //condition to verify if there are more than 2 points so we get a polygon area
    if(area[2]!=null)
    {
    //calculate the bounds of this area
    bounds = pvtools.getBounds(area);
    //calculate the height of the area    
    longueur = pvtools.getDistance(
        { lat: bounds.minLat, lon: bounds.maxLng },
        { lat: bounds.maxLat, lon: bounds.maxLng }
    );
    //calculate the width of the area
    largeur = pvtools.getDistance(
        { lat: bounds.minLat, lon: bounds.maxLng },
        { lat: bounds.minLat, lon: bounds.minLng }
    );
    //calculate the geo increment of the raws
    rowInc = bounds.maxLat - geolib.computeDestinationPoint({ latitude: bounds.maxLat, longitude: bounds.minLng }, 3, 180).latitude;
    
    //calculate the geo increment of the columns
    columnInc = geolib.computeDestinationPoint({ latitude: bounds.maxLat, longitude: bounds.minLng }, 2, 90).longitude - bounds.minLng;
    
    //loop on the raws
    for (let i = bounds.maxLat; i > bounds.minLat; i -= rowInc) {
     
        //loop on the columns
        for (let j = bounds.minLng; j < bounds.maxLng; j += columnInc) {

            //4 conditions to verify if the whole 4 coins of the panel are in the area
            if (pvtools.pointInArea({ lat: i, lon: j }, area)) {

                if (pvtools.pointInArea({ lat: i, lon: j + columnInc }, area)) {
                    if (pvtools.pointInArea({ lat: Number(i - rowInc), lon: Number(j + columnInc) }, area)) {

                        if (pvtools.pointInArea({ lat: Number(i - rowInc), lon: Number(j) }, area)) {
                            
                            let cell = new Array();
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
    

   /* p.estimated_actuals.foreach((x) => {
        data.push({x.pv_estimate, new Date(x.period_end).getTime()});
    })*/
    // res.json({ "bounds": bounds, "longueur": longueur, "largeur": largeur,"rawinc":rawInc,"colinc":columnInc,"number of cells":inc,"cells":cells});
    

    //create the new project
    var c =  new Project({
        name: req.body.projectName,
        area: req.body.points,
        lat: center.latitude,
        lon: center.longitude,
        surface: surface,
        tilt:req.body.tilt,
        panel: {height:req.body.panelHeight,width:req.body.panelWidth,capacity:req.body.panelCapacity},
        direction: direction,
        panel_number: inc
    });
    c.save().then(() => {

        data = null;

    }).catch((err) => {
        res.status(400).send({
            message: "erreur : " + err
        })
    });

    /*axios.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(c.lat) + "&longitude=" + Number(c.lon) + "&capacity=1&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json")
    .then(function (response) {
      
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .finally(function () {
      // always executed
    });*/
    res.status(200).send({'project':c});
    }
    res.json({"numberofpanels": 0});
    
};

exports.estimation = function(req,res)
{
    axios.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(req.body.lat) + "&longitude=" + Number(req.body.lon) + "&capacity=1&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json")
    .then(function (response) {
      res.status(200).send(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .finally(function () {
      // always executed
    });   
}

exports.allProjects = function(req,res){
    
    Project.find({},'name lat lon surface direction azimuth zenith panel_number install_date',(err, docs) => {
        if (!err) {
            res.status(200).send(docs);
        }
        else { console.log("error in retriving projects" + jason.stringify(err, undefined, 2)); }

    })
}

exports.dashboard = function(req,res){
    
    Project.find({},'name lat lon surface panel_number area',(err, docs) => {
        if (!err) {
            res.status(200).send(docs);
        }
        else { console.log("error in retriving dashboard" + json.stringify(err, undefined, 2)); }

    })
}

exports.project_delete = function (req, res) {
    
    Project.findByIdAndRemove(req.params.id, function (err) {
        if (err) return next(err);
        res.send('Deleted successfully!',200);
    })
};

exports.project_details = function(req,res)
{
    var c;
    Project.findById(req.params.id, function (err, p) {
        axios.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(p.lat) + "&longitude=" + Number(p.lon) + "&capacity="+Number(p.panel.capacity*p.panel_number)+"&hours=168&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json")
        .then(function (response) {
            res.send({'project': p,'estimation': response.data});
        })
        .catch(function (error) {
        // handle error
        console.log(error);
        })
        .finally(function () {
        // always executed
        });
            
    });
   
            

            //res.send('jawk behy');
    
}
