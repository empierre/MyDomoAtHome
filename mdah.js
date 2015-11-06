//##############################################################################
//  This file is part of MyDomoAtHome - https://github.com/empierre/MyDomoAtHome
//      Copyright (C) 2014-2015 Emmanuel PIERRE (domoticz@e-nef.com)
//
// MyDomoAtHome is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 2 of the License, or
//  (at your option) any later version.
//
//  MyDomoAtHome is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with MyDomoAtHome.  If not, see <http://www.gnu.org/licenses/>.
//##############################################################################

// dependencies
var express = require("express");
var _ = require("underscore");
var http = require("http");
var path = require('path');
var request = require("request");
var querystring = require("querystring");
var nconf = require('nconf');
var os = require("os");
var moment = require('moment');
var app = express();

//working variaboles
var last_version_dt;
var last_version =getLastVersion();
var ver="0.12";

// all environments
app.set('port', process.env.PORT || 3002);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// load conf file
nconf.use('file', { file: './config.json' });
nconf.load();
console.log(nconf.get('domo_path'));
console.log(os.hostname());
nconf.save(function (err) {
  if (err) {
    console.error(err.message);
    return;
  }
  //console.log('Configuration saved successfully.');
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function getLastVersion() {
    var now = moment();
    if ((last_version_dt)&&(last_version_dt.isBefore(moment().add(4,'h')))) {
        return(last_version);
    } else {
        var options = {
            url: "https://api.github.com/repos/empierre/MyDomoAtHome/releases/latest",
            headers: {
                'User-Agent': 'request'
            }
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                last_version_dt=now;
                last_version=data.tag_name;
                return (data.tag_name);
            } else {
                return ("unknown");
            }
        });
    }
};


//routes
app.get('/', function(req, res){
  res.sendfile(__dirname + '/public/index.html');
});

app.get("/system", function(req, res){
    var version=nconf.get('app_name');
    res.type('json');
    var latest=getLastVersion();
    res.json(
	 { "id":version , "apiversion": latest });
});

app.get("/rooms", function(req, res){
    res.type('json');    
    res.json(
	 { "rooms": [
                { "id": "Switches", "name": "Switches" },
                { "id": "Scenes", "name": "Scenes" },
                { "id": "Temp", "name": "Temperature" },
                { "id": "Weather", "name": "Weather" },
                { "id": "Utility", "name": "Utility" }
                     ]
	});
});

app.get("/devices", function(req, res){
    res.type('json');    
    var options = {
    url: nconf.get('domo_path')+"/json.htm?type=devices&filter=all&used=true&order=Name",
	  headers: {
	  'User-Agent': 'request'
          }
    };
    request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
	var data=JSON.parse(body); 
	var result = [];
	//my ID string
	var myfeed = {"id": "S0", "name": "MyDomoAtHome", "type": "DevGenericSensor"};
	myfeed.params={"key": "Value", "value": "1.0", "unit": "", "graphable": "false"};
	result.push(myfeed);
    if (ver != getLastVersion()) {
        var myfeed = {"id": "S1", "name": "New version found", "type": "DevGenericSensor"};
        myfeed.params={"key": "Value", "value": last_version, "unit": "", "graphable": "false"};
        result.push(myfeed);
    }
	res.json(result);

	for(var i = 0; i < data.result.length; i++) {
		//console.log(data.result[i].Type);
		switch(data.result[i].Type) {
			case (data.result[i].Type.match(/Lighting/)||{}).input:
                switch(data.result[i].SwitchType) {
                    case 'On/Off','Lighting Limitless/Applamp','Contact','Dusk Sensor':
                        console.log("Switch "+data.result[i].Name);
                    case 'Push On Button','Push Off Button':
                        console.log("POB "+data.result[i].Name);
                    case 'Dimmer','Doorbell':
                        console.log("DIM "+data.result[i].Name);
                    case 'Blinds Inverted':
                        console.log("BLIND "+data.result[i].Name);
                    case 'Blinds Percentage':
                    case 'Blinds','Venetian Blinds EU','Venetian Blinds US':
                    case 'Motion Sensor':
                    case 'Door Lock':
                    default:
                        console.log("S "+data.result[i].Name);
                }
				break;
            case 'Security':
                console.log("SEC "+data.result[i].Name);
                break;
            case 'P1 Smart Meter','YouLess Meter':
                switch(data.result[i].SubType) {
                    case 'Energy', 'YouLess counter':
                    case 'Gas':
                    default:
                }
                break;
            case 'Energy':
            case 'Usage':
            case 'Current/Energy':
            case 'Temp + Humidity':
            case 'Temp + Humidity + Baro':
            case 'Temp':
            case 'Humidity':
            case 'Rain':
            case 'UV':
            case 'Lux':
            case 'Air Quality':
            case 'Wind':
            case 'RFXMeter':
			case 'General':
                switch(data.result[i].SubType) {
                    case 'Percentage':
                    case 'Voltage':
                    case 'kWh':
                    case 'Pressure':
                    case 'Visibility':
                    case 'Solar Radiation':
                    case 'Text', 'Alert', 'Unknown':
                    case 'Sound Level':
                }
				console.log("G "+data.result[i].Name);
				break;
            case 'Thermostat':
			default:
				console.log("U "+data.result[i].Name);
				break;
		}
	}
    } else {
	    res.json("error");
    } 
})
});

//get '/devices/:deviceId/:paramKey/histo/:startdate/:enddate'
//get '/devices/:deviceId/action/:actionName/?:actionParam?' 
//get '/devices' 
//


//start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

