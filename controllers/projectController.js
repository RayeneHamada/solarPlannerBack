const mongoose  = require('mongoose'),
Project = mongoose.model('Projects'),
User = mongoose.model('Users'),
Panel = mongoose.model('Panels'),

fs = require('fs'),
geolib = require('geolib'),
pvtools = require("pvtools"),
axios = require('axios').default,
{Canvas} = require('canvas'),
SunCalc = require('suncalc'),
geoTz = require('geo-tz'),
moment = require('moment-timezone'),
crg = require('country-reverse-geocoding').country_reverse_geocoding(),
{ getCode } = require('country-list'),
parseString = require('xml2js').parseString,
schedule = require('node-schedule');

//main function
exports.create = async (req, res) => {
    //Array containing the angles of the area
    var area = [],
    //Panel object of the panel used in this project
    panel,
    // center of the project area
    center,
    //Surface area
    surface,
    //country
    country='',
    //Internet code of the country
    country_code='',
    //Timezone of the area
    timezone = '',
    //Currency of the country
    currency='',
    //Average price of a kw of electrecity
    price='',
    forecastsByday = [],
    pv_today=[],
    estimationsByday = [],
    offset,
    sunrise,
    sunset,
    pv_prod = 0;
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
    //condition to verify if there are more than 2 points so we get a polygon area
    if(area[2]!=null)
    {
        console.log(crg.get_country(center.latitude, center.longitude))
        console.log(center)
    //get the country where the area is located
    country = "Tunisia"
    //country = crg.get_country(center.latitude, center.longitude)
    //get the country internet code
    country_code = getCode(country);
    //get the timezone of the area
    timezone = geoTz(center.latitude, center.longitude)[0];

    if(req.body.panelId){
        await Panel.findById(req.body.panelId).exec().then((p)=>{panel = p});
    }
    axios.get('https://www.globalpetrolprices.com/api_gpp_el.php?uid=2701&ind=elhh,elin,elexu,elexe&cnt='
    +country_code+'&prd=latest&uidc=83fc987eb3c3de3f4900a56af05860d7')
    .then(function (response) {
    parseString(response.data, function (err, result) {
        if(result['gpp:data']['gpp:element'][0]['gpp:currency'])
        { currency = result['gpp:data']['gpp:element'][0]['gpp:currency'][0] ;
         price = Number(result['gpp:data']['gpp:element'][0]['gpp:average'][0]) ;}
        else{
             currency= 'none';
             price = 0;
        }
    offset = moment().tz(timezone).utcOffset();
    sunrise = SunCalc.getTimes(new Date(), center.latitude,center.longitude,0).sunrise;
    sunset = SunCalc.getTimes(new Date(), center.latitude,center.longitude,0).sunset;
    sunrise = moment(new Date(sunrise)).tz(timezone).hours();
    sunset = moment(new Date(sunset)).tz(timezone).hours();
    axios.get("https://api.solcast.com.au//world_pv_power/forecasts?latitude=" + Number(center.latitude) + "&longitude=" + Number(center.longitude) + "&capacity="+Number(panel.capacity*req.body.panelNumber)+"&hours=168&api_key=j88bZmpSZ6Hl9wivrMFBLxZqXcLR9Xv4&format=json")
     .then(function (response) {
        let today = new Date();
        let today_here = moment(today).tz(timezone).date();
        let pv_per_day = 0;
        let date_of_loop = moment(response.data.forecasts[0].period_end);
        if(moment(response.data.forecasts[0].period_end).tz(timezone).date() == today_here )
        {
            date_of_loop = moment(new Date(response.data.forecasts[0].period_end).setDate(new Date(response.data.forecasts[0].period_end).getDate()+1)).tz(timezone).date();
        }
        for(let i=0;i<response.data.forecasts.length;i++)
        {
            if(moment(response.data.forecasts[i].period_end).tz(timezone).date() == today_here)
            {
                for(j=sunrise;j<=sunset;j++)
                    if(moment(response.data.forecasts[i].period_end).tz(timezone).hours()==j)
                    {
                        pv_prod+=Number(response.data.forecasts[i].pv_estimate);
                        pv_today.push({date_time:new Date(response.data.forecasts[i].period_end),pv:Number(response.data.forecasts[i].pv_estimate)});                                  
                    }       
            }
            else
            {
                if(moment(response.data.forecasts[i].period_end).tz(timezone).date() == date_of_loop)
                {pv_per_day+=response.data.forecasts[i].pv_estimate;}
                else
                {
                 forecastsByday.push({'date_time':new Date(response.data.forecasts[i].period_end),'pv':pv_per_day});
                 pv_per_day = Number(response.data.forecasts[i].pv_estimate);
                 date_of_loop = moment(response.data.forecasts[i].period_end).tz(timezone).date();
                }
            }
        }
        pv_per_day = 0;
        
         axios.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(center.latitude) + "&longitude=" + Number(center.longitude) + "&capacity="+Number(panel.capacity*req.body.panelNumber)+"&hours=168&api_key=6OxRaAVQFrzoHSQPLdq85RJpVxCHS6Ll&format=json")
                .then(function (response2) {
                    
                    if(moment(response2.data.estimated_actuals[0].period_end).tz(timezone).date() == today_here )
                    {
                        date_of_loop = moment(new Date(response2.data.estimated_actuals[0].period_end).setDate(new Date(response2.data.estimated_actuals[0].period_end).getDate()-1)).tz(timezone).date();
                    }
                    else
                    {
                        date_of_loop = moment(new Date(response2.data.estimated_actuals[0].period_end)).tz(timezone).date();
                    }
                    for(let i=0;i<response2.data.estimated_actuals.length;i++)
                    {
                        if(moment(response2.data.estimated_actuals[i].period_end).tz(timezone).date() == today_here)
                        {
                           
                            for(j=sunrise;j<=sunset;j++)
                            {
                               
                                if(moment(response2.data.estimated_actuals[i].period_end).tz(timezone).hours()==j)
                                {
                                           pv_today.push({date_time:new Date(response2.data.estimated_actuals[i].period_end),pv:Number(response2.data.estimated_actuals[i].pv_estimate)});
                                            pv_prod+=Number(response2.data.estimated_actuals[i].pv_estimate);
                                    
                                }   
                            }
                        }
                        else
                        {
                            if(moment(response2.data.estimated_actuals[i].period_end).tz(timezone).date() == date_of_loop)
                            {pv_per_day+=response2.data.estimated_actuals[i].pv_estimate;}
                            else
                            {

                                estimationsByday.push({'date_time':new Date(response2.data.estimated_actuals[i-1].period_end),'pv':pv_per_day});
                             pv_per_day = Number(response2.data.estimated_actuals[i].pv_estimate);
                             date_of_loop = moment(response2.data.estimated_actuals[i].period_end).tz(timezone).date();
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
        tilt:req.body.tilt,
        rawSpacing:req.body.rawSpacing,
        prod_today: pv_today,
        total_prod: pv_prod,
        next_prod: forecastsByday,
        previous_prod: estimationsByday,
        direction: req.body.direction,
        panel_number: req.body.panelNumber,
        panel: panel._id,
        owner: req._id
    });

    c.save((err, doc) => {
        if(err){
            console.log(err);
            return res.status(503).send(err);
        }
        else
        {
            res.status(200).send(doc)
            midnight = 0-1+offset/60;
            console.log(midnight);

        schedule.scheduleJob('47 '+3+' * * *', function()
        {
            update_production_data(c);
        });
        }
    })

    }).catch(function (error) {
        console.log(error);
      });
    }).catch(function (error) {
        console.log(error);
      });
    })
    }).catch(function (error) {
        console.log(error);
      });
    }
    
};

exports.optimalConfig = async(req,res) => {
    //Array containing the coins of the area
    var area = [],
    //Array containing the bounds of the area (maxLat,minLat,maxLon,minLon)
    bounds = [],
    //Panel object of the panel used in this project
    panel,
    //Array containing the 4 geopoints of the solar panel
    cells = new Array(),
    //The number of the panels
    inc = 0,  
    // center of the project area
    center,
    // Direction of the solar panels;
    direction,
    // Distance between raws
    rawSpacing;
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
        lat = Math.abs(center.latitude);
    if(lat<25)
    {
        tilt = lat*0.87;
    }
    if(lat>=25 && lat<=50)
    {
        tilt = (lat*0.76)+3.1;
    }
    if(lat>50)
    {
        tilt = lat-10;
    }
    tilt = tilt.toFixed(2);
    
    //condition to verify if there are more than 2 points so we get a polygon area
    if(area[2]!=null)
    {
    //calculate the bounds of this area
    bounds = pvtools.getBounds(area);
    await Panel.findById(req.body.panelId).exec().then((p)=>{panel = p});

    //Calculate the distance between raws
    rawSpacing = panel.height/Math.tan(61-lat);
    rawSpacing = Math.abs(rawSpacing).toFixed(2);    

    //loop on the raws
    for(i=bounds.maxLat;i>bounds.minLat;i=geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, panel.height/100+rawSpacing/100, 180).latitude)
    {
     for(j=bounds.minLng;j< bounds.maxLng;j = geolib.computeDestinationPoint({ latitude: i,longitude: j }, panel.width/100, 90).longitude)

        {

            let lng1= geolib.computeDestinationPoint({ latitude: i,longitude: j }, Number(panel.width/100), 90).longitude;
            let lat1 = geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, Number(panel.height/100), 180).latitude;
                            

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
res.status(200).send({'panel_number':inc,'direction':direction,'tilt':tilt, 'rawSpacing':rawSpacing});
}

exports.allProjects = function(req,res){
    
    Project.find({owner: req._id},'name lat lon surface direction azimuth zenith panel_number install_date',(err, docs) => {
        if (!err) {
            res.status(200).send(docs);
        }
        else { res.status(503).send(err); }

    })
};

exports.dashboard = function(req,res){
    
    Project.find({owner: req._id},'name lat lon surface panel_number area prod_today next_prod previous_prod',(err, docs) => {
        if (!err) {
            Project.aggregate(
                [
                  {$match:{"owner":mongoose.Types.ObjectId(req._id)}},
                  {$group:
                    {
                      _id:"$owner",
                      total:{$sum:'$total_prod'},
                      
                    }
                  }
                ],
                function(err,result){
                    if(result[0])
                  {res.send({'projects':docs,'total_prod':result[0].total});}
                  else{res.send({'projects':docs,'total_prod':'0'});}
                }
                )
        }
        else {
            
            res.status(503).send(err); }

    })
};

exports.project_delete = function (req, res) {
    
    Project.findByIdAndRemove(req.params.id, function (err) {
        if (err) return next(err);
        res.send('Deleted successfully!',200);
    })
};

exports.project_details = function(req,res)
{
    Project.findById(req.params.id)
    .populate('panel')
    .exec(function (err, p) {
        if (err) return res.status(500).send(err);
        else
        {
            var sunrise = SunCalc.getTimes(new Date(), p.lat,p.lon,0).sunrise;
            sunrise = moment(new Date(sunrise)).tz(p.timezone);
            sunrise = sunrise.hours()+':'+sunrise.minutes();
            var sunset = SunCalc.getTimes(new Date(), p.lat,p.lon,0).sunset;
            sunset = moment(new Date(sunset)).tz(p.timezone);
            sunset = sunset.hours()+':'+sunset.minutes();
            var solarnoon = SunCalc.getTimes(new Date(), p.lat,p.lon,0).solarNoon;
            solarnoon = moment(new Date(solarnoon)).tz(p.timezone);
            solarnoon = solarnoon.hours()+':'+solarnoon.minutes();
            res.status(200).send({'project':p,'sunrise':sunrise, 'solarnoon':solarnoon,'sunset':sunset});
        }
    })
};

exports.sun_details = function(req,res)
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
            
            sunPath.push({'hour':i,'azimuth':azimuth, 'solar_elevation': solarElevation});
        }  
        res.status(200).send(sunPath);          
      });
   
              
};

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
};

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
};

exports.project_plan = function (reqq, res) {
    Project.findById(reqq.params.id).populate('panel').exec((err, p) =>{
        if (err) {return next(err);}
        let req = {'body':{'points':p.area}}

    var area = [],
    //Array containing the bounds of the area (maxLat,minLat,maxLon,minLon)
    bounds = [],
    //Panel object of the panel used in this project
    panel = p.panel,
    //Array containing the 4 geopoints of the solar panel
    cells = new Array();
    //loop to fill area with the data from the request
    for (let i = 0; i < req.body.points.length; i++) {
        let y = Number(req.body.points[i].lat),
            x = Number(req.body.points[i].lon);
        area.push({ latitude: y, longitude: x });
    }
    //calculate the bounds of this area
    bounds = pvtools.getBounds(area);
    
    //loop on the raws
    for(i=bounds.maxLat;i>bounds.minLat;i=geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, panel.height/100+50/100, 180).latitude)
    {
     for(j=bounds.minLng;j< bounds.maxLng;j = geolib.computeDestinationPoint({ latitude: i,longitude: j }, panel.width/100, 90).longitude)

        {

            let lng1= geolib.computeDestinationPoint({ latitude: i,longitude: j }, Number(panel.width/100)+(p.rawSpacing/100), 90).longitude;
            let lat1 = geolib.computeDestinationPoint({ latitude: i, longitude: bounds.minLng }, Number(panel.height/100), 180).latitude;
                            

            if (pvtools.pointInArea({ lat: i, lon: j }, area)) 
            {
                if (pvtools.pointInArea({ lat: i, lon: lng1 }, area)) 
                {
                    if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) 
                    {

                        if (pvtools.pointInArea({ lat: lat1, lon: lng1 }, area)) 
                        {
                            
                            let cell = new Array();
                            cell.push(
                                geolib.getCenterOfBounds([
                                { latitude: i, longitude: j },
                                { latitude: i, longitude: lng1 },
                                { latitude: lat1, longitude: lng1 },
                                { latitude:lat1, longitude: j },
                            ]));
                            cells.push(cell);                          
                        }   
                    }
                }               
            }
        } 
    }

    let boundingRect = getBoundingRect(req);
    let scale = Math.min(700, 700);
    var canvas = new Canvas(800, 800, 'pdf');
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 800, 800);
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

  })
};

function update_production_data (p){
    var timezone = p.timezone;
    var today = new Date();
    var forecastsByday = [];
    var pv_today=[];
    var estimationsByday = [];
    var offset = moment().tz(timezone).utcOffset();
    var sunrise = SunCalc.getTimes(today, p.lat,p.lon,0).sunrise;
    var sunset = SunCalc.getTimes(today, p.lat,p.lon,0).sunset;
    sunrise = moment(new Date(sunrise)).tz(timezone).hours();
    sunset = moment(new Date(sunset)).tz(timezone).hours();
    var yesterday = new Date().setDate(today.getDate()-1);

    axios.get("https://api.solcast.com.au//world_pv_power/forecasts?latitude=" + Number(p.lat) + "&longitude=" + Number(p.lon) + "&capacity="+Number(p.panel.capacity*p.panel_number)/1000+"&hours=168&api_key=LvMhWe_LaRKDsjCl1IVM115PEKplwzei&format=json")
     .then(function (response) {
        let pv_prod = p.total_prod;
        let today = new Date();
        let today_here = moment(today).tz(timezone).date();
        let pv_per_day = 0;
        let date_of_loop = moment(response.data.forecasts[0].period_end);
        if(moment(response.data.forecasts[0].period_end).tz(timezone).date() == today_here )
        {
            date_of_loop = moment(new Date(response.data.forecasts[0].period_end).setDate(new Date(response.data.forecasts[0].period_end).getDate()+1)).tz(timezone).date();
        }
        for(let i=0;i<response.data.forecasts.length;i++)
        {
            if(moment(response.data.forecasts[i].period_end).tz(timezone).date() == today_here)
            {
                for(j=sunrise;j<=sunset;j++)
                    if(moment(response.data.forecasts[i].period_end).tz(timezone).hours()==j)
                    {
                        pv_prod+=Number(response.data.forecasts[i].pv_estimate);
                        pv_today.push({date_time:new Date(response.data.forecasts[i].period_end),pv:Number(response.data.forecasts[i].pv_estimate)});
                                    
                            
                    }   
                
            }
            else
            {
                if(moment(response.data.forecasts[i].period_end).tz(timezone).date() == date_of_loop)
                {pv_per_day+=response.data.forecasts[i].pv_estimate;}
                else
                {
                 forecastsByday.push({'date_time':new Date(response.data.forecasts[i].period_end),'pv':pv_per_day});
                 pv_per_day = Number(response.data.forecasts[i].pv_estimate);
                 date_of_loop = moment(response.data.forecasts[i].period_end).tz(timezone).date();
                }
            }
        }

        pv_per_day = 0;

        




        axios.get("https://api.solcast.com.au//world_pv_power/estimated_actuals?latitude=" + Number(p.lat) + "&longitude=" + Number(p.lon) + "&capacity="+Number(p.panel.capacity*p.panel_number)/1000+"&hours=168&api_key=6OxRaAVQFrzoHSQPLdq85RJpVxCHS6Ll&format=json")
               .then(function (response2) {
                   
                   if(moment(response2.data.estimated_actuals[0].period_end).tz(timezone).date() == today_here )
                   {
                       date_of_loop = moment(new Date(response2.data.estimated_actuals[0].period_end).setDate(new Date(response2.data.estimated_actuals[0].period_end).getDate()-1)).tz(timezone).date();
                   }
                   else
                   {
                       date_of_loop = moment(new Date(response2.data.estimated_actuals[0].period_end)).tz(timezone).date();
                   }
                   for(let i=0;i<response2.data.estimated_actuals.length;i++)
                   {
                       if(moment(response2.data.estimated_actuals[i].period_end).tz(timezone).date() == today_here)
                       {
                          
                           for(j=sunrise;j<=sunset;j++)
                           {
                              
                               if(moment(response2.data.estimated_actuals[i].period_end).tz(timezone).hours()==j)
                               {
                                          pv_today.push({date_time:new Date(response2.data.estimated_actuals[i].period_end),pv:Number(response2.data.estimated_actuals[i].pv_estimate)});
                                           pv_prod+=Number(response2.data.estimated_actuals[i].pv_estimate);
                                   
                               }   
                           }
                       }
                       else
                       {
                           if(moment(response2.data.estimated_actuals[i].period_end).tz(timezone).date() == date_of_loop)
                           {pv_per_day+=response2.data.estimated_actuals[i].pv_estimate;}
                           else
                           {

                            estimationsByday.push({'date_time':new Date(response2.data.estimated_actuals[i-1].period_end),'pv':pv_per_day});
                            pv_per_day = Number(response2.data.estimated_actuals[i].pv_estimate);
                            date_of_loop = moment(response2.data.estimated_actuals[i].period_end).tz(timezone).date();
                           }
                       }
                   }
                });
            });
    Project.findByIdAndUpdate(p.id, {$set: {prod_today: pv_today,next_prod: forecastsByday,previous_prod: estimationsByday}}, function (err, project) {
        if(err)
        {
            console.log(err)
        }
    })

};

exports.admin_all_projects = function(req,res){
    
    Project.find({},'name lat lon surface panel_number total_prod install_date country owner.fullName')
    .populate('owner','fullName')
    .exec((err,p)=>{
        if(err)
        {
            console.log(err);
            res.status(500).send(err);
        }
        else
        {
            res.send(p);
        }
    })
};

exports.admin_project_delete = function (req, res) {
    
    Project.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }
        else{
            res.send('Deleted successfully!',200);
        }
    })
};

exports.admin_dashboard = function (req,res) {
    Project.find({},'name lat lon surface panel_number area, total_prod country owner.fullname')
    .populate({path:'owner',select:'fullName'})
    .exec((err,p)=>{
        if(err)
        {
            console.log(err);
            res.status(500).send(err.message);
        }
        else
        {
            Project.aggregate(
                [
                  //{$match:{"owner":mongoose.Types.ObjectId("5e9c26e7e4f6ad24d816575e")}},
                  {$group:
                    {
                      _id:null,
                      total:{$sum:'$total_prod'},
                      
                    }
                  }
                ],
                function(err,result){
                    User.countDocuments({'role':'user'}, function(err,c){
                        if(result[0])
                        {
                            res.send({'projects':p,'users':c,'number_of_projects':p.length,'total_prod':result[0].total});
                        }
                        else{
                            res.send({'projects':p,'users':c,'number_of_projects':p.length,'total_prod':0});

                        }                    
                    })
                }
                )
          
            
        }
    })
}

exports.admin_all_solar_panels = function(req,res){
    Project.aggregate([ { 
        $group: { 
            _id: null,
            total_panels: { 
                $sum: "$panel_number" 
            },
            total_pv: {
                $sum: "$total_prod"
            },
        },
         
    } ],(err,p) => {
        if(!err)
        {
            res.status(200).send(p);
        }
        else{
            res.status(500).send(err);
        }
    } )
}
