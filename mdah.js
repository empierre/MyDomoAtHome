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
function getLocalWeather(q, onResult) {
  var baseurl = "http://api.worldweatheronline.com/free/v1/weather.ashx";

  var options = {
    q: q,
    num_of_days: '1',
    format: 'json',
    //you need to replace with your own key by registering on WWO website
    key: 'xkq544hkar4m69qujdgujn7w'
  };

  var query = querystring.stringify(options);
  var url = baseurl + "?" + query;

  //inject error message into template
  function injectError(error) {
    if(getLocalWeather.previousResult == null)
        return errorView(error);
    else
        return resultView(getLocalWeather.previousResult, error);
  }

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
          var jsonres = JSON.parse(output)
          if(jsonres.data.hasOwnProperty('error'))
              onResult(res.statusCode, injectError(jsonres.data.error[0].msg)); 
          else {
              getLocalWeather.previousResult = jsonres;
              onResult(res.statusCode, resultView(jsonres, null));
            }
      });
    } else
      onResult(res.statusCode, injectError("Something wrong with the server. Status Code: " + res.statusCode));
  }).on('error', function(e) {
      onResult(res.statusCode, injectError(e.message));
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

//get '/devices/:deviceId/:paramKey/histo/:startdate/:enddate'
//get '/devices/:deviceId/action/:actionName/?:actionParam?' 
//get '/devices' 
//


//start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

