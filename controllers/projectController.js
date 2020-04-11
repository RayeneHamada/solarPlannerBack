const mongoose  = require('mongoose'),
Project = mongoose.model('Projects'),
fs = require('fs'),
geolib = require('geolib'),
pvtools = require("pvtools"),
axios = require('axios').default,
{Canvas} = require('canvas'),
SunCalc = require('suncalc'),
geoTz = require('geo-tz'),
moment = require('moment-timezone'),
crg = require('country-reverse-geocoding').country_reverse_geocoding(),
{ getCode, getName } = require('country-list'),
parseString = require('xml2js').parseString;



//main function
exports.test = function (req, res) {
    console.log("you've called the backend");
    //Array containing the coins of the area
    var area = [];
    //Array containing the bounds of the area (maxLat,minLat,maxLon,minLon)
    var bounds = [];
    //height and width of the area
    var height, width;
    //Raw spacing
    const rawDim = 2;
    //Length of the panel
    var cellDim = 1;
    //Array containing the 4 geopoints of the solar panel
    var cells = new Array();
    //The number of the panels
    var inc = 0;   
    // center of the project area
    var center;
    // Direction of the solar panels;
    var direction;
    //Surface area
    var surface;
    //country
    var country;
    //Internet code of the country
    var country_code;
    //Timezone of the area
    var timezone = '';
    //Currency of the country
    var currency;
    //Average price of a kw of electrecity
    var price;
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
    if(center.latitude>0)
        {direction = "South";}
    else
        {direction = "north";}
    //condition to verify if there are more than 2 points so we get a polygon area
    if(area[2]!=null)
    {
    //calculate the bounds of this area
    bounds = pvtools.getBounds(area);
    //calculate the height of the area    
    height = pvtools.getDistance(
        { lat: bounds.minLat, lon: bounds.maxLng },
        { lat: bounds.maxLat, lon: bounds.maxLng }
    );
    //calculate the width of the area
    width = pvtools.getDistance(
        { lat: bounds.minLat, lon: bounds.maxLng },
        { lat: bounds.minLat, lon: bounds.minLng }
    );
    //get the country where the area is located
    country = crg.get_country(center.latitude, center.longitude).name;
    //get the country internet code
    country_code = getCode(country);
    //get the timezone of the area
    timezone = geoTz(center.latitude, center.longitude)[0];

    axios.get('https://www.globalpetrolprices.com/api_gpp_el.php?uid=1787&ind=elhh&cnt='
    +country_code+'&prd=latest&uidc=536b5a3a56e9c22263870adb5788814d')
    .then(function (response) {
    parseString(response.data, function (err, result) {
        let currency = result['gpp:data']['gpp:element'][0]['gpp:currency'][0] ;
        let price = Number(result['gpp:data']['gpp:element'][0]['gpp:average'][0]) ;
    
    

    //loop on the raws
    for(i=bounds.maxLat;i>bounds.minLat;i=geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, 4, 180).latitude)
    {
     for(j=bounds.minLng;j< bounds.maxLng;j = geolib.computeDestinationPoint({ latitude: i,longitude: j }, 2, 90).longitude)

        {

            let lng1= geolib.computeDestinationPoint({ latitude: i,longitude: j }, 2, 90).longitude;
            let lat1 = geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, 4, 180).latitude;
                            

            if (pvtools.pointInArea({ lat: i, lon: j }, area)) {
                if (pvtools.pointInArea({ lat: i, lon: lng1 }, area)) {
                    if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) {

                        if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) {
                            
                            let cell = new Array();
                            cell.push(
                                geolib.getCenterOfBounds([
                                { latitude: i, longitude: j },
                                { latitude: i, longitude: lng1 },
                                { latitude: lat1, longitude: lng1 },
                                { latitude:lat1, longitude: j },
                            ]));

                            cells.push(cell);
                            inc++;
                            
                        }
                    }
                }
                
            }
            
        }
    }
    

    //create the new project
    var c =  new Project({
        name: req.body.projectName,
        area: req.body.points,
        lat: center.latitude,
        lon: center.longitude,
        surface: surface,
        timezone: timezone,
        currency:currency,
        price: price,
        country:country,
        width: width,
        height : height, 
        tilt:req.body.tilt,
        panel: {height:req.body.panelHeight,width:req.body.panelWidth,capacity:req.body.panelCapacity},
        direction: direction,
        panel_number: inc,
        owner: req._id
    });
    c.save().then(() => {

        res.status(200).send({'project':c});

    }).catch((err) => {
        res.status(400).send({
            message: "erreur : " + err
        })
    });

    });
    });
    }
    
};


exports.allProjects = function(req,res){
    
    Project.find({owner: req._id},'name lat lon surface direction azimuth zenith panel_number install_date',(err, docs) => {
        if (!err) {
            res.status(200).send(docs);
        }
        else { console.log("error in retriving projects" + JSON.stringify(err, undefined, 2)); }

    })
}

exports.dashboard = function(req,res){
    
    Project.find({owner: req._id},'name lat lon surface panel_number area',(err, docs) => {
        if (!err) {
            console.log(req.role);
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
    Project.findById(req.params.id, function (err, p) {
        if (err) return next(err);
        var timezone = p.timezone;
        var sunrise = SunCalc.getTimes(new Date(), p.lat,p.lon,0).sunrise;
        sunrise = moment(new Date(sunrise)).tz(timezone);
        sunrise = sunrise.hours()+':'+sunrise.minutes();
        var sunset = SunCalc.getTimes(new Date(), p.lat,p.lon,0).sunset;
        sunset = moment(new Date(sunset)).tz(timezone);
        sunset = sunset.hours()+':'+sunset.minutes();
        var solarnoon = SunCalc.getTimes(new Date(), p.lat,p.lon,0).solarNoon;
        solarnoon = moment(new Date(solarnoon)).tz(timezone);
        solarnoon = solarnoon.hours()+':'+solarnoon.minutes();
        res.status(200).send({'project':p,'sunrise':sunrise, 'solarnoon':solarnoon,'sunset':sunset});

    })

};

exports.energy_details = function(req,res)
{
        Project.findById(req.params.id, function (err, p) {
       // p ={'timezone':'Europe/Madrid','lat':40.33483730171493,'lon':-3.878755740935532,panel:{capacity:'1500'},panel_number:3910};
        var timezone = p.timezone;
        var offset = moment().tz(timezone).utcOffset();
        var today = new Date();
        var sunPath = [];
       
        var sunrise = SunCalc.getTimes(new Date(), p.lat,p.lon,0).sunrise;
        var sunset = SunCalc.getTimes(new Date(), p.lat,p.lon,0).sunset;
        var sunmoon = SunCalc.getTimes(new Date(), p.lat,p.lon,0).solarNoon;
        sunrise = moment(new Date(sunrise)).tz(timezone).hours();
        sunset = moment(new Date(sunset)).tz(timezone).hours();
        for(let i=Number(sunrise);i<=Number(sunset)+1;i++)
        {
           
            date = new Date(today.getFullYear(),today.getMonth(),today.getDate(),i+2-offset/60,0,0,0)  ,Number(p.lat), Number(p.lon);
            var azimuth = SunCalc.getPosition (date  ,Number(p.lat), Number(p.lon)).azimuth*180/Math.PI ;
            if(azimuth<180)
                azimuth+=180;
            else
                azimuth-=180;
            var solarElevation = SunCalc.getPosition(date  ,Number(p.lat), Number(p.lon)).altitude*180/Math.PI;
            
            sunPath.push({'hour':i,'azimuth':azimuth, 'solar_elevation': solarElevation, 'pv':0});
        }
        
        axios.get("https://api.solcast.com.au//world_pv_power/forecasts?latitude=" + Number(p.lat) + "&longitude=" + Number(p.lon) + "&capacity="+Number(p.panel.capacity*p.panel_number)+"&hours=168&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json")
        .then(function (response) {
            var forecastsByday = [];
            var day = moment(new Date(response.data.forecasts[0].period_end)).tz(timezone).date();
            var month = new Date(response.data.forecasts[0].period_end).getMonth();
            var hour = new Date(response.data.forecasts[0].period_end).getHours();
            var pvPerDay = Number(response.data.forecasts[0].pv_estimate);
            for(let i=0;i<response.data.forecasts.length;i++)
            {
                if(moment(new Date(response.data.forecasts[i].period_end)).tz(timezone).date() == moment(new Date()).tz(timezone).date())
                {
                      for(let j=0;j<sunPath.length;j++)
                    {
                        if(sunPath[j].hour == moment(new Date(response.data.forecasts[i].period_end)).tz(timezone).hours
                        ())
                        {
                            sunPath[j].pv += Number(response.data.forecasts[i].pv_estimate);
                        }
                    }
                }

                if(moment(new Date(response.data.forecasts[i].period_end)).tz(timezone).date()== day)
                {
                    pvPerDay += Number(response.data.forecasts[i].pv_estimate);
                }
                else
                {
                    forecastsByday.push({'day':day+'/'+month,'pv':pvPerDay});
                    var day = moment(new Date(response.data.forecasts[i].period_end)).tz(timezone).date();
                    var month = new Date(response.data.forecasts[i].period_end).getMonth();
                    pvPerDay = Number(response.data.forecasts[i].pv_estimate);
                    

                }
               
                

            }
                axios.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(p.lat) + "&longitude=" + Number(p.lon) + "&capacity="+Number(p.panel.capacity*p.panel_number)+"&hours=168&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json")
                .then(function (response2) {
                    var estimationsByday = [];
                    var day = moment(new Date(response2.data.estimated_actuals[0].period_end)).tz(timezone).date();
                    var month = new Date(response2.data.estimated_actuals[0].period_end).getMonth();
                   
                    var pvPerDay = Number(response2.data.estimated_actuals[0].pv_estimate);
                    for(let i=0;i<response2.data.estimated_actuals.length;i++)
                    {
                        if(moment(new Date(response2.data.estimated_actuals[i].period_end)).tz(timezone).date() == moment(new Date()).tz(timezone).date())
                        {   
                            for(let j=0;j<sunPath.length;j++)
                            {
                                if(sunPath[j].hour == moment(new Date(response2.data.estimated_actuals[i].period_end)).tz(timezone).hours
                                ())
                                {
                                    
                                    sunPath[j].pv += Number(response2.data.estimated_actuals[i].pv_estimate);
                                }
                            }
                        }
                        if(moment(new Date(response2.data.estimated_actuals[i].period_end)).tz(timezone).date()== day)
                        {
                            pvPerDay += Number(response2.data.estimated_actuals[i].pv_estimate);
                        }
                        else
                        {
                            estimationsByday.push({'day':day+'/'+month,'pv':pvPerDay});
                            day = moment(new Date(response2.data.estimated_actuals[i].period_end)).tz(timezone).date();
                            month = new Date(response2.data.estimated_actuals[i].period_end).getMonth(); 
                            pvPerDay = Number(response2.data.estimated_actuals[i].pv_estimate);

                        }

                    }

                    res.send({'forecast':forecastsByday,'estimation':estimationsByday,'sun_path':sunPath});

                })
                .catch(function (error) {
                // handle error
                console.log(error);
                })
                .finally(function () {
                // always executed
                });

        })
        .catch(function (error) {
        // handle error
        console.log(error);
        })
        .finally(function () {
        // always executed
        });
            
      });
   
              
}









exports.visitor_test = function (req, res) {
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
    if(center.latitude>0)
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
    rowInc = bounds.maxLat - geolib.computeDestinationPoint({ latitude: bounds.maxLat, longitude: bounds.minLng }, 2, 180).latitude;
    
    //calculate the geo increment of the columns
    columnInc = geolib.computeDestinationPoint({ latitude: bounds.maxLat, longitude: bounds.minLng }, 4, 90).longitude - bounds.minLng;
    
    for(i=bounds.maxLat;i>bounds.minLat;i=geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, 4, 180).latitude)
    {
     for(j=bounds.minLng;j< bounds.maxLng;j = geolib.computeDestinationPoint({ latitude: i,longitude: j }, 2, 90).longitude)

        {

            let lng1= geolib.computeDestinationPoint({ latitude: i,longitude: j }, 2, 90).longitude;
            let lat1 = geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, 4, 180).latitude;
                            

            if (pvtools.pointInArea({ lat: i, lon: j }, area)) {
                if (pvtools.pointInArea({ lat: i, lon: lng1 }, area)) {
                    if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) {

                        if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) {
                            
                            let cell = new Array();
                            cell.push(
                                geolib.getCenterOfBounds([
                                { latitude: i, longitude: j },
                                { latitude: i, longitude: lng1 },
                                { latitude: lat1, longitude: lng1 },
                                { latitude:lat1, longitude: j },
                            ]));

                            cells.push(cell);
                            inc++;
                            
                        }
                    }
                }
                
            }
            
        }
    }
}
res.status(200).send({'numberOfPanels':inc, 'direction': direction});
}








function getBoundingRect(data) {
    let left ;
    let top  ;
    let area = [];
    for(let i = 0 ;i<data.body.points.length;i++)
    {
        area.push({latitude: data.body.points[i].lat , longitude: data.body.points[i].lon});
    }
    let bounds = pvtools.getBounds(area);
    left = bounds.minLng;
    right = bounds.maxLng;
    top = bounds.maxLat;
    bottom = bounds.minLat;
    

    return {x: left, y: top, width: right - left, height: bottom - top};
  }





exports.project_plan = function (reqq, res) {
    Project.findById(reqq.params.id, function (err, p) {
        if (err) {return next(err);}
        let req = {'body':{'points':p.area}}

  

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
    if(center.latitude>0)
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
    
    //loop on the raws
    for(i=bounds.maxLat;i>bounds.minLat;i=geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, 4, 180).latitude)
    {
     for(j=bounds.minLng;j< bounds.maxLng;j = geolib.computeDestinationPoint({ latitude: i,longitude: j }, 2, 90).longitude)

        {

            let lng1= geolib.computeDestinationPoint({ latitude: i,longitude: j }, 2, 90).longitude;
            let lat1 = geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, 4, 180).latitude;
                            

            if (pvtools.pointInArea({ lat: i, lon: j }, area)) {
                if (pvtools.pointInArea({ lat: i, lon: lng1 }, area)) {
                    if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) {

                        if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) {
                            
                            let cell = new Array();
                            cell.push(
                                geolib.getCenterOfBounds([
                                { latitude: i, longitude: j },
                                { latitude: i, longitude: lng1 },
                                { latitude: lat1, longitude: lng1 },
                                { latitude:lat1, longitude: j },
                            ]));

                            cells.push(cell);
                            inc++;
                            
                        }
                    }
                }
                
            }
            
        }
    }
   




    let boundingRect = getBoundingRect(req);
    let scale = Math.min(2000, 2000);
    var canvas = new Canvas(4000, 4000, 'pdf');
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 7000, 7000);
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";


    for (let i = 0; i < req.body.points.length; i++) 
    {
        let lat = Number(req.body.points[i].lat);
        let lon = Number(req.body.points[i].lon);
        let x = (lon  - boundingRect.x) / boundingRect.width  * scale;
        let y = 700 - (lat - boundingRect.y) / boundingRect.height * scale;
      
        if(i==0)
        {
            ctx.moveTo(x, y);}
        else
        ctx.lineTo(x, y);
        if(i== req.body.points.length-1)
        {
            ctx.closePath();
        }
    }
    ctx.stroke();

    for(let i = 0;i<cells.length;i++)
    {
        let lat = Number(cells[i][0].latitude);
        let lon = Number(cells[i][0].longitude);
        let x = (lon  - boundingRect.x) / boundingRect.width  * scale;
        let y = 700 - (lat - boundingRect.y) / boundingRect.height * scale;
        ctx.fillRect(x, y, 3, 3);
    }






   res.writeHead(200, {'content-type' : 'application/pdf'});
   res.write( canvas.toBuffer() );
   res.end();  

}  })
};
