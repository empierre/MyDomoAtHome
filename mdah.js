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
var device_tab={};
var device = {MaxDimLevel : null,Action:null,graph:null};


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

function DevSwitch(data) {
    var status =0;
    switch(data.Status) {
        case 'On': status=1;break;
        case 'Off': status=0;break;
        case 'Open': status=1;break;
        case 'Closed': status=0;break;
        case 'Panic': status=1;break;
        case 'Normal': status=0;break;
        default: status=0;break;
    }
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": "Switches"};
    myfeed.params={"key": "Status", "value": status};
    return(myfeed);
};
function DevPush(data) {
    var status =0;
    switch(data.SwitchType) {
        case 'Push On Button': status=1;break;
        case 'Push Off Button': status=0;break;
        default: status=0;break;
    }
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": "Switches"};
    myfeed.params={"key": "Status", "value": status};
    return(myfeed);
};
function DevRGBLight(data) {
    var status =0;
    switch(data.SwitchType) {
        case 'Push On Button': status=1;break;
        case 'Push Off Button': status=0;break;
        default: status=0;break;
    }

    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevRGBLight", "room": "Switches"};
    if (data.Status == 'Set Level') {
        var mydev={MaxDimLevel : null,Action:null,graph:null};
        if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
        mydev.MaxDimLevel=data.MaxDimLevel;
        device_tab[data.idx]=mydev;
        myfeed.params={"key": "Status", "value": status, "dimmable":1, "Level": data.Level};
    } else {
        myfeed.params={"key": "Status", "value": status};
    }
    return(myfeed);
};
function DevDimmer(data) {
    var status =0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDimmer", "room": "Switches"};
    if (data.Status == 'Set Level') {
        status = 1;
    }
    var mydev={MaxDimLevel : null,Action:null,graph:null};
    if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
    mydev.MaxDimLevel=data.MaxDimLevel;
    device_tab[data.idx]=mydev;
    myfeed.params={"key": "Status", "value": status, "Level": data.Level};

    return(myfeed);
};
function DevShutterInverted(data) {
    var status=0;
    var lvl=0;
    var mydev={MaxDimLevel : null,Action:null,graph:null};
    if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
    mydev.Action=5;
    device_tab[data.idx]=mydev;
    if (data.Status == 'Open') {
        lvl=100;
        status=1;
    } else {
        lvl=0;
        status=0;
    };
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};
    myfeed.params={"key": "Status", "value": status, "Level": lvl,"stoppable":0,"pulsable":0};
    return(myfeed);
};
function DevShutter(data) {
    var status=0;
    var lvl=0;
    var stoppable=0;
    var mydev={MaxDimLevel : null,Action:null,graph:null};
    if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
    mydev.Action=6;
    device_tab[data.idx]=mydev;
    if (data.Status == 'Open') {
        lvl=100;
        status=1;
    } else {
        lvl=0;
        status=0;
    };
    if ((data.SwitchType == 'Venetian Blinds EU')||(data.SwitchType == 'Venetian Blinds US')||(data.SwitchType == 'RollerTrol, Hasta new')) {stoppable=1;}
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};
    myfeed.params={"key": "Status", "value": status, "Level": lvl,"stoppable":stoppable,"pulsable":0};
    return(myfeed);
};
function DevMotion(data) {
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMotion", "room": "Switches"};
    myfeed.params={"Armable":0,"Ackable":0,"Armed":1,"Tripped":data.Status};
    return(myfeed);
};
function DevDoor(data) {
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": "Switches"};
    myfeed.params={"Armable":0,"Ackable":0,"Armed":1,"Tripped":data.Status};
    return(myfeed);
};
function DevSmoke(data) {
    var ackable=0;
    if (data.Type=='Security') {ackable=1;}
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSmoke", "room": "Switches"};
    myfeed.params={"Armable":0,"Ackable":ackable,"Armed":1,"Tripped":data.Status};
    return(myfeed);
};
function DevFlood(data) {};
function DevCO2(data) {};
function DevGenericSensor(data) {
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
    myfeed.params={"key":"Value", "Value":data.Status};
    return(myfeed);
};
function DevElectricity(data) {
    var ptrn1= /(\d+) Watt/;
    var ptrn2= /([0-9]+(?:\.[0-9]+)?)/;
    var ptrn3= /[\s,]+/;

    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
    var params=[];
    if (data.Usage>0) {
        var res= ptrn1.exec(data.Usage);
        var usage=0;
        if (res != null) {usage=res[1]}

        if (!usage) {
            usage = 0;
        }
        params.push({"key": "Watts", "value": usage, "unit": "W"});
    }
    if (data.Data) {
        var res=ptrn2.exec(data.Data);
        var total=0;
        if (res != null) {total = Math.ceil(res[1]);}
        params.push({"key": "ConsoTotal", "value": total, "unit": "kWh", "graphable": "true"});
    }
    myfeed.params=params;
    return(myfeed);
}
function DevElectricityMultiple(data) {
    var ptrn1= /(\d+) Watt/;
    var ptrn2= /([0-9]+(?:\.[0-9]+)?)/;
    var ptrn3= /[\s,]+/;
    var combo=[];

    var res=data.Data.split(ptrn3);
    var usage=0;
    if (res != null) {
        //L1
        usage=res[0];
        var myfeed = {"id": data.idx+"_L1", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
        var params=[];
        params.push({"key": "Watts", "value": usage, "unit": "W"});
        myfeed.params=params;
        combo.push(myfeed);
        //L2
        usage=res[2];
        var myfeed = {"id": data.idx+"_L2", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
        var params=[];
        params.push({"key": "Watts", "value": usage, "unit": "W"});
        myfeed.params=params;
        combo.push(myfeed);
        //L3
        usage=res[4];
        var myfeed = {"id": data.idx+"_L3", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
        var params=[];
        params.push({"key": "Watts", "value": usage, "unit": "W"});
        myfeed.params=params;
        combo.push(myfeed);
    }
    return(combo);
}
function DevGas(data) {
    var ptrn1= /(\d+) m3/;
    var ptrn2= /([0-9]+(?:\.[0-9]+)?)/;
    var ptrn3= /[\s,]+/;

    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
    var params=[];
    if (data.Usage>0) {
        var res= ptrn1.exec(data.CounterToday);
        var usage=0;
        if (res != null) {usage=res[1]}

        if (!usage) {
            usage = 0;
        }
        params.push({"key": "Watts", "value": usage, "unit": "m3"});
    }
    if (data.Data) {
        var res=ptrn2.exec(data.Counter);
        var total=0;
        if (res != null) {total = Math.ceil(res[1]);}
        params.push({"key": "ConsoTotal", "value": total, "unit": "m3", "graphable": "true"});
    }
    myfeed.params=params;
    return(myfeed);
}


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

        for(var i = 0; i < data.result.length; i++) {
            //console.log(data.result[i].Type);
            switch(data.result[i].Type) {
                case (data.result[i].Type.match(/Lighting/)||{}).input:
                    switch(data.result[i].SwitchType) {
                        case 'On/Off':
                        case 'Contact':
                        case 'Dusk Sensor':
                        case 'Lighting Limitless/Applamp':
                            if (data.result[i].SubType =='RGB') {
                                result.push(DevRGBLight(data.result[i]));
                            } else {
                                result.push(DevSwitch(data.result[i]));
                            }
                            break;
                        case 'Push On Button':
                        case 'Push Off Button':
                            result.push(DevPush(data.result[i]));
                            break;
                        case 'RGB':
                            result.push(DevRGBLight(data.result[i]));
                            break;
                        case 'Dimmer':
                        case 'Doorbell':
                            result.push(DevDimmer(data.result[i]));
                            break;
                        case 'Blinds Inverted':
                            result.push(DevShutterInverted(data.result[i]));
                            break;
                        case 'Blinds Percentage':
                        case 'Blinds':
                        case 'Venetian Blinds EU':
                        case 'Venetian Blinds US':
                            result.push(DevShutter(data.result[i]));
                            break;
                        case 'Motion Sensor':
                            result.push(DevMotion(data.result[i]));
                            break;
                        case 'Door Lock':
                            result.push(DevDoor(data.result[i]));
                            break;
                        case 'Smoke Detector':
                            result.push(DevSmoke(data.result[i]));
                            break;
                        case (data.result[i].SwitchType.match(/Siren/)||{}).input:
                            result.push(DevGenericSensor(data.result[i]));
                            break;
                        default:
                            console.log("UNK Sw "+data.result[i].Name);
                            break;
                    }
                    break;
                case 'Security':
                    switch(data.result[i].SwitchType) {
                        case 'Smoke Detector':
                            result.push(DevSmoke(data.result[i]));
                            break;
                        case 'Security':
                            result.push(DevGenericSensor(data.result[i]));
                            break;
                        default:
                            console.log("UNK Sec "+data.result[i].Name);
                            break;
                    }
                case 'P1 Smart Meter':

                    switch(data.result[i].SubType) {
                        case 'Energy':
                            result.push(DevElectricity(data.result[i]));
                            break;
                        case 'Gas':
                            result.push(DevGas(data.result[i]));
                            break;
                        default:
                    }
                    break;
                case 'YouLess Meter':
                    switch(data.result[i].SubType) {
                        case 'YouLess counter':
                            result.push(DevElectricity(data.result[i]));
                            break;
                        default:
                            console.log("UNK Sec "+data.result[i].Name);
                            break;
                    }
                    break;
                case 'Energy':
                    result.push(DevElectricity(data.result[i]));
                    break;
                case 'Usage':
                    result.push(DevElectricity(data.result[i]));
                    break;
                case 'Current/Energy':
                    result.push(DevElectricityMultiple(data.result[i]));
                    break;
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

                        case 'Text':
                        case 'Alert':
                        case 'Unknown':
                              break;

                        case 'Sound Level':
                    }
                    //console.log("G "+data.result[i].Name);
                    break;
                case 'Thermostat':
                default:
                    //console.log("U "+data.result[i].Name);
                    break;
            }
        }
        res.json(result);
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

