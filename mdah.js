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
var cheerio = require('cheerio');
var request = require("request");
var querystring = require("querystring");
var nconf = require('nconf');
var app = express();

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


//get data
function getDevices(onResult) {
  //var baseurl = nconf.get('domo_path')+"/json.htm";
  var baseurl = nconf.get('domo_path')+"/json.htm?type=devices&filter=all&used=true&order=Name";

//  var options = {
//    type: 'switch',
//    idx: '1',
//    range: 1
//  };

//  var query = querystring.stringify(options);
//  var url = baseurl + "?" + query;
  var url = baseurl ;
  console.log(url);
  //REST API
  http.get(url, function(res) {
    if(res.statusCode == 200) {
      console.log("Got response: " + res.statusCode);
      res.setEncoding('utf8');

      var output = '';
      res.on('data', function (chunk) {
          output += chunk;
      });

      res.on('end', function () {
          var jsonres = Object.create(null);
          jsonres = JSON.parse(output);
          onResult(res.statusCode, jsonres);
      });
    } else
      onResult(res.statusCode, "Something wrong with the server. Status Code: " + res.statusCode);
  }).on('error', function(e) {
      onResult(res.statusCode, e.message);
  });
}


//routes
app.get('/', function(req, res){
  res.sendfile(__dirname + '/public/index.html');
});

app.get("/system", function(req, res){
    var version=nconf.get('app_name');
    res.type('json');    
    res.json(
	 { "id":version , "apiversion":"1" });
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
	res.json(result);

	for(var i = 0; i < data.result.length; i++) {
		//console.log(data.result[i].Type);
		switch(data.result[i].Type) {
			case (data.result[i].Type.match(/Lighting/)||{}).input:
				console.log("S "+data.result[i].Name);	
				break;
			case 'General':
				console.log("G "+data.result[i].Name);
				break;
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

