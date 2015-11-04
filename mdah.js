
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
app.get("/", function(req, res){
    var onResult = function (statusCode, result) {
        res.send(result);
    };

    var q = req.param('q');
    if(q == null || q == undefined || q == "") 
        if (req.ip == "127.0.0.1" || req.ip.indexOf("192.168.") == 0)
            res.send(errorView(null));
        else
            getLocalWeather(req.ip, onResult);
    else
        getLocalWeather(q, onResult);
});

//start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

