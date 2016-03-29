//##############################################################################
//  This file is part of MyDomoAtHome - https://github.com/empierre/MyDomoAtHome
//      Copyright (C) 2014-2016 Emmanuel PIERRE (domoticz@e-nef.com)
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
var http = require("http");
var express = require("express");
var _ = require("underscore");
var path = require('path');
var request = require("request");
//var querystring = require("querystring");
var nconf = require('nconf');
var os = require("os");
var moment = require('moment');
var morgan = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth');
//var multer = require('multer');
var errorHandler = require('errorhandler');
var requester = require('sync-request');
var winston = require('winston');
var pjson = require('./package.json');
global.logger = winston;
var app = express();

//working variaboles
var last_version_dt;
var last_version =getLastVersion();
var ver=pjson.version;
var device_tab={};
var room_tab=[];
var device = {MaxDimLevel : null,Action:null,graph:null,Selector:null};
var app_name="MyDomoAtHome";
var domo_path    = process.env.DOMO || "http://127.0.0.1:8080";
var port         = process.env.PORT || '3002';

//configuration
app.set('port', port);
app.set('view engine', 'ejs');
var home = process.env.MDAH_HOME || path.resolve(__dirname+"/..");
app.use(express.static(path.join(__dirname + '/public')));
app.set('views', path.resolve(__dirname + '/views'));
app.use(morgan('combined'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
logger.add(winston.transports.File, { filename: '/var/log/mydomoathome/usage.log' });

// load conf file
nconf.use('file', { file: './config.json' },function (err) {
    if (err) {
        console.error("No local conf:"+err.message);
        return;
    }});

nconf.use('file', { file: '/etc/mydomoathome/config.json' },function (err) {
    if (err) {
        console.error("No conf in etc:"+err.message);
        return;
    }});
nconf.load({ file: './config.json' },function (err) {
    if (err) {
        console.error("No local conf:"+err.message);
        return;
    }});
if (! nconf.get('domo_path')) {
    logger.warn('/etc/mydomoathome/config.json not found, defaulting')
} else {
    domo_path=process.env.DOMO || nconf.get('domo_path');
    app.set('port', process.env.PORT || nconf.get('port'));
    app_name=nconf.get('app_name')||"MyDomoAtHome";
}


function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
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
function devSt(deviceId,Status) {
	var rbl;
	switch (Status) {
        case "On":
            rbl=1;
            var mydev=device_tab[deviceId];
            if (mydev) {
                mydev.Action=1;
                device_tab[deviceId]=mydev;
            } else {
                mydev={MaxDimLevel : null,Action:1,graph:null,Selector:null};
            }
            device_tab[deviceId]=mydev;
            break;
		case "Off":
            rbl=0;
            var mydev=device_tab[deviceId];
            if (mydev) {
                mydev.Action=1;
                device_tab[deviceId]=mydev;
            } else {
                mydev={MaxDimLevel : null,Action:1,graph:null,Selector:null};
            }
            device_tab[deviceId]=mydev;
            break;
		case "Open":
            rbl=1;
            var mydev=device_tab[deviceId];
            if (mydev) {
                mydev.Action=2;
                device_tab[deviceId]=mydev;
            } else {
                mydev={MaxDimLevel : null,Action:2,graph:null,Selector:null};
            }
            device_tab[deviceId]=mydev;
            break;
		case "Closed":
            rbl=0;
            var mydev=device_tab[deviceId];
            if (mydev) {
                mydev.Action=2;
                device_tab[deviceId]=mydev;
            } else {
                mydev={MaxDimLevel : null,Action:2,graph:null,Selector:null};
            }
            device_tab[deviceId]=mydev;
            break;
        case "Panic":
            rbl=1;
            var mydev=device_tab[deviceId];
            if (mydev) {
                mydev.Action=3;
                device_tab[deviceId]=mydev;
            } else {
                mydev={MaxDimLevel : null,Action:3,graph:null,Selector:null};
            }
            device_tab[deviceId]=mydev;
            break;
		case "Normal":
            rbl=0;
            var mydev=device_tab[deviceId];
            if (mydev) {
                mydev.Action=3;
                device_tab[deviceId]=mydev;
            } else {
                mydev={MaxDimLevel : null,Action:3,graph:null,Selector:null};
            }
            device_tab[deviceId]=mydev;
            break;
		default: rbl=Status;break;
	}
	return rbl;
}

function DevSwitch(data) {
    room_tab.Switches=1;
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
    params=[];
    params.push({"key": "Status", "value": status.toString()});
    //TODO key Energy
    myfeed.params=params;
    return(myfeed);
}

function DevMultiSwitch(data) {
    var ptrn4= /[\s]+|/;
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": "Switches"};
    var params=[];
    params.push({"key": "LastRun", "value": dt});
    var status;
    //console.log("L:"+data.Level);
    var res=data.LevelNames.split('|').join(',');
    var ret=data.LevelNames.split('|');
    var mydev={MaxDimLevel : null,Action:null,graph:null,Selector:ret};
    //console.log(mydev);
    device_tab[data.idx]=mydev;
    var lvl=(data.Level)/10;
    params.push({"key": "Value", "value": ret[lvl].toString()});
    params.push({"key": "Choices", "value": res});
    myfeed.params=params;
    return(myfeed);
};

function DevPush(data) {
    room_tab.Switches = 1;
    var status =0;
    switch(data.SwitchType) {
     case 'Push On Button': status=1;break;
     case 'Push Off Button': status=0;break;
     default: status=0;break;
    }
    /*var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": "Switches"};
    myfeed.params={"key": "Status", "value": status};*/
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": "Switches"};
    params=[];
    //params.push({"key": "Status", "value": status.toString()});
    params.push({"key": "pulseable", "value": "1"});
    myfeed.params=params;
    return (myfeed);
}
function DevRGBLight(data) {
    var status =0;status=devSt(data.idx,data.Status);
    room_tab.Switches=1;
    switch(data.SwitchType) {
        case 'Push On Button': status=1;break;
        case 'Push Off Button': status=0;break;
        default: status=0;break;
    }
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevRGBLight", "room": "Switches"};
    if (data.Status.match(/Set Level/)) {
        var mydev={MaxDimLevel : null,Action:null,graph:null};
        if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
        mydev.MaxDimLevel=data.MaxDimLevel;
        device_tab[data.idx]=mydev;
        params=[];
        params.push({"key": "Status", "value": "1"});//hyp: set level only when on
        params.push({"key": "dimmable", "value": "1"});
        params.push({"key": "Level", "value": data.Level.toString()});
        //TODO whitechannel
        //TODO color
        //TODO Energy value unit
        myfeed.params=params;
    } else {
        params=[];
        params.push({"key": "Status", "value": status});
        myfeed.params=params;
    }
    return(myfeed);
};
function DevDimmer(data) {
    var status =0;
    room_tab.Switches=1;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDimmer", "room": "Switches"};
    //console.log(data.Status);
    status=devSt(data.idx,data.Status);
    if (data.Status.match(/Set Level/)) {
        status = 1;
    }
    var mydev={MaxDimLevel : null,Action:null,graph:null};
    if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
    mydev.MaxDimLevel=data.MaxDimLevel;
    mydev.Action=0;
    //console.log(mydev);
    device_tab[data.idx]=mydev;
    params=[];
    params.push({"key": "Status", "value": status.toString()});
    params.push({"key": "Level", "value": data.Level.toString()});
    //TODO key Energy value unit
    myfeed.params=params;
    return(myfeed);
};
function DevShutterInverted(data) {
    var status=0;status=devSt(data.idx,data.Status);
    room_tab.Switches=1;
    var lvl=0;
    var mydev={MaxDimLevel : null,Action:null,graph:null};
    if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
    mydev.Action=5;
    mydev.MaxDimLevel=data.MaxDimLevel;
    device_tab[data.idx]=mydev;
    //console.log(data.Status+" "+data.Level);
    if (data.Status === 'Open') {
        lvl=data.Level||100;
        status=1;
    } else if (data.Status.match(/Set Level/)) {
        lvl = data.Level;
        //console.log(data.status+" "+lvl);
        if (lvl>0) {status=1} else {status=0};
    } else {
        lvl=data.Level||0;
        status=0;
    };
    //console.log(data.idx+" "+status+" "+lvl);
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};
    params=[];
    params.push({"key": "Status", "value": status});
    params.push({"key": "Level", "value": lvl.toString()});
    params.push({"key": "stoppable", "value": "1"});
    params.push({"key": "pulsable", "value": "0"});
    myfeed.params=params;
    //console.log(params);
    return(myfeed);
};
function DevShutter(data) {
    var status=0;status=devSt(data.idx,data.Status);
    room_tab.Switches=1;
    var lvl=0;
    var stoppable=0;
    var mydev={MaxDimLevel : null,Action:null,graph:null};
    if (device_tab[data.idx]) {mydev=device_tab[data.idx];}
    mydev.Action=6;
    mydev.MaxDimLevel=data.MaxDimLevel;
    device_tab[data.idx]=mydev;
    //console.log(data.Status+" "+data.Level);
    if (data.Status == 'Open') {
        lvl=data.Level||100;
        status=1;
    } else if (data.Status.match(/Set Level/)) {
        lvl = data.Level;
        //console.log(data.status+" "+lvl);
        if (lvl>0) {status=1} else {status=0};
    } else {
        lvl=data.Level||0;
        status=0;
    };
    //console.log(data.idx+" "+status+" "+lvl);
    if ((data.SwitchType == 'Venetian Blinds EU')||(data.SwitchType == 'Venetian Blinds US')||(data.SwitchType == 'RollerTrol, Hasta new')) {stoppable=1;}
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};
    params=[];
    params.push({"key": "Status", "value": status});
    params.push({"key": "Level", "value": lvl.toString()});
    params.push({"key": "stoppable", "value": stoppable.toString()});
    params.push({"key": "pulsable", "value": "0"});

    myfeed.params=params;
    return(myfeed);
};
function DevMotion(data) {
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMotion", "room": "Switches"};
    params=[];var value=devSt(data.idx,data.Status);
    //console.log(data.Status+" "+value);
    params.push({"key":"Armable", "value":"0"});
    params.push({"key":"ackable", "value":"0"});
    params.push({"key":"Armed", "value":"1"});
    params.push({"key":"Tripped", "value":value.toString()});
    params.push({"key":"lasttrip", "value":dt.toString()});
    myfeed.params=params;
    return(myfeed);
};
function DevDoor(data) {//TODO
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": "Switches"};
    params=[];var value=devSt(data.idx,data.Status);
    params.push({"key":"armable", "value":"0"});
    params.push({"key":"Ackable", "value":"0"});
    params.push({"key":"Armed", "value":"1"});
    params.push({"key":"Tripped", "value":value.toString()});
    params.push({"key":"lasttrip", "value":dt.toString()});
    myfeed.params=params;
    return(myfeed);
};
function DevLock(data) {
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": "Switches"};
    params=[];var value=devSt(data.idx,data.Status);
    params.push({"key":"armable", "value":"0"});
    params.push({"key":"Ackable", "value":"0"});
    params.push({"key":"Armed", "value":"1"});
    params.push({"key":"Tripped", "value":value.toString()});
    params.push({"key":"lasttrip", "value":dt.toString()});
    myfeed.params=params;
    return(myfeed);
};
function DevSmoke(data) {
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable=0;
    if (data.Type=='Security') {ackable=1;}
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSmoke", "room": "Switches"};
    params=[];var value=devSt(data.idx,data.Status);
    params.push({"key":"Armable", "value":"0"});
    params.push({"key":"ackable", "value":ackable.toString()});
    params.push({"key":"Armed", "value":"1"});
    params.push({"key":"Tripped", "value":value.toString()});
    params.push({"key":"lasttrip", "value":dt.toString()});
    myfeed.params=params;
    return(myfeed);
};
function DevFlood(data) {
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable=0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevFlood", "room": "Switches"};
    params=[];var value=devSt(data.idx,data.Status);
    params.push({"key":"armable", "value":"0"});
    params.push({"key":"Ackable", "value":ackable.toString()});
    params.push({"key":"Armed", "value":"1"});
    params.push({"key":"Tripped", "value":value.toString()});
    params.push({"key":"lasttrip", "value":dt.toString()});
    myfeed.params=params;
    return(myfeed);
}
function DevCO2(data) {
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable=0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2", "room": "Switches"};
    params=[];var value=devSt(data.idx,data.Status);
    params.push({"key":"armable", "value":"0"});
    params.push({"key":"Ackable", "value":ackable.toString()});
    params.push({"key":"Armed", "value":"1"});
    params.push({"key":"Tripped", "value":value.toString()});
    params.push({"key":"lasttrip", "value":dt.toString()});
    myfeed.params=params;
    return(myfeed);
}
function DevCO2Alert(data) {
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable=0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2Alert", "room": "Switches"};
    params=[];var value=devSt(data.idx,data.Status);
    params.push({"key":"armable", "value":"0"});
    params.push({"key":"ackable", "value":ackable.toString()});
    params.push({"key":"Armed", "value":"1"});
    params.push({"key":"Tripped", "value":value.toString()});
    params.push({"key":"lasttrip", "value":dt.toString()});
    myfeed.params=params;
    return(myfeed);
}

function DevGenericSensor(data) {
    room_tab.Utility=1;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
    if (data.Status) {
        params=[];
        params.push({"key": "Value", "value": data.Status.toString()});
        myfeed.params = params;
    } else {
        params=[];
        //console.log(data;)
        params.push({"key": "Value", "value": data.Data.toString()});
        myfeed.params = params;
    }
    return(myfeed);
};
function DevGenericSensorT(data) {
    room_tab.Utility=1;
    var ptrn=/([0-9]+(?:\.[0-9]+)?) ?(.+)/;
    var res=data.Data.match(ptrn).slice(1);
    var value=res[0];
    var suffix=res[1];
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
    params=[];
    params.push({"key": "Value", "value": value.toString()});
    params.push({"key": "unit", "value": suffix.toString()});
    params.push({"key": "graphable", "value": "true"});
    myfeed.params = params;
    return (myfeed);
};
function DevElectricity(data) {
    room_tab.Utility = 1;
    var ptrn1 = /(\d+) Watt/;
    var ptrn2 = /([0-9]+(?:\.[0-9]+)?) Watt/;
    var ptrn3 = /[\s,]+/;

    var myfeed;
    var params = [];var combo = [];
    if (data.UsageDeliv) {
        //Energy pannel
        //develectricity Counter/Usage
        var myfeed1= {"id": data.idx+"_1", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
        var params = []
        var res = ptrn2.exec(data.Usage);
        var usage = 0;
        if (res != null) {
            usage = Math.ceil(Number(res[1]));
        }
        params.push({"key": "Watts", "value": usage, "unit": "W"});
        params.push({"key": "ConsoTotal", "value": Math.ceil(Number(data.Counter)), "unit": "kWh", "graphable": "true"});
        myfeed1.params=params;
        combo.push(myfeed1);
        //develectricity CounterDeliv/UsageDeliv
        var params=[];
        var myfeed2= {"id": data.idx+"_2", "name": data.Name+ "Deliv", "type": "DevElectricity", "room": "Utility"};
        var res = ptrn2.exec(data.UsageDeliv);
        var usagedeliv = 0;
        if (res != null) {
            usagedeliv = Math.ceil(Number(res[1]));
        }
        params.push({"key": "Watts", "value": usagedeliv, "unit": "W"});
        params.push({"key": "ConsoTotal", "value": Math.ceil(Number(data.CounterDeliv)), "unit": "kWh", "graphable": "true"});
        myfeed2.params=params;
        combo.push(myfeed2);
        //devgeneric for CounterToday/CounterDelivToday
        var params=[];
        var myfeed3= {"id": data.idx+"_3", "name": data.Name+" CounterToday", "type": "DevGenericSensor", "room": "Utility"};
        var res = ptrn2.exec(data.CounterToday);
        var CounterToday = 0;
        if (res != null) {
            CounterToday = Math.ceil(Number(res[1]));
        }
        params.push({"key": "Value", "value": CounterToday, "unit": "kWh", "graphable": "true"});
        myfeed3.params=params;
        combo.push(myfeed3);
        var params=[];
        var myfeed4= {"id": data.idx+"_4", "name": data.Name+" CounterDelivToday", "type": "DevGenericSensor", "room": "Utility"};
        var res = ptrn2.exec(data.CounterDelivToday);
        var CounterDelivToday = 0;
        if (res != null) {
            CounterDelivToday = Math.ceil(Number(res[1]));
        }
        params.push({"key": "Value", "value": Math.ceil(Number(CounterDelivToday)), "unit": "kWh", "graphable": "false"});
        myfeed4.params=params;
        combo.push(myfeed4);
        return(combo);
    } else {
        myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
        if (data.Usage) {
            var res = ptrn2.exec(data.Usage);
            var usage = 0;
            if (res != null) {
                usage = res[1]
            }

            if (!usage) {
                usage = 0;
            }
            params.push({"key": "Watts", "value": usage, "unit": "W"});
            if (data.Data) {
                var res = ptrn2.exec(data.Data);
                var total = 0;
                if (res != null) {
                    total = Math.ceil(Number(res[1]));
                }
                params.push({"key": "ConsoTotal", "value": total.toString(), "unit": "kWh", "graphable": "true"});
            }
        } else {
            var res = ptrn2.exec(data.Data);
            var total = 0;
            if (res != null) {
                total = Math.ceil(Number(res[1]));
            }
            params.push({"key": "Watts", "value": total.toString(), "unit": "W", "graphable": "true"});
        }
        myfeed.params=params;
        return(myfeed);
    }
}
function DevElectricityMultiple(data) {
    room_tab.Utility=1;
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
        params.push({"key": "Watts", "value": usage.toString()});
        params.push({"key": "unit", "value": "W"});

        myfeed.params=params;
        combo.push(myfeed);
        //L2
        usage=res[2];
        var myfeed = {"id": data.idx+"_L2", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
        var params=[];
        params.push({"key": "Watts", "value": usage.toString()});
        params.push({"key": "unit", "value": "W"});;
        myfeed.params=params;
        combo.push(myfeed);
        //L3
        usage=res[4];
        var myfeed = {"id": data.idx+"_L3", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
        var params=[];
        params.push({"key": "Watts", "value": usage.toString()});
        params.push({"key": "unit", "value": "W"});
        myfeed.params=params;
        combo.push(myfeed);
    }
    return(combo);
}
function DevCounterIncremental(data) {
    room_tab.Utility=1;
    var ptrn1= /(\d+) Watt/;
    var ptrn2= /([0-9]+(?:\.[0-9]+)?) /;
    var ptrn3= /[\s,]+/;

    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
    var params=[];
    var unit;
    switch(data.SwitchTypeVal) {
        case '0':
            //energy
            unit='kWh';
            break;
        case '1':
            //gas
            unit='m3';
            break;
        case '2':
            //water
            unit='m3';
            break;
        case '3':
            //counter free
            unit=data.ValueUnits.toString();
            break;
        case '4':
            //energy generated
            unit='kWh';
            break;
        default:
            break;
    }

    if (data.Counter) {
        var res = ptrn2.exec(data.CounterToday);
        var usage = 0;
        if (res != null) {
            usage = Math.ceil(Number(res[1]));
        }
        if (!usage) {
            usage = 0;
        }
        res = Math.ceil(usage);
        //console.log("T1 "+data.CounterToday);
        params.push({"key": "Watts", "value": usage, "unit": unit});
        if (data.Counter) {
            var res = ptrn2.exec(data.Counter);
            //console.log(res[1]);
            var total = 0;
            if (res != null) {
                total = Math.ceil(Number(res[1]));
            }
            //console.log("T2"+total);
            params.push({"key": "ConsoTotal", "value": total.toString(),"unit": unit,"graphable":"true"});
        }
    } else {
        var res = ptrn2.exec(data.Data);
        var total = 0;
        if (res != null) {
            total = Math.ceil(Number(res[1]));
        }
        //console.log(total);
        params.push({"key": "Watts", "value": total.toString(),"unit": unit,"graphable":"true"});
    }

    myfeed.params=params;
    return(myfeed);
}
function DevGas(data) {
    room_tab.Utility=1;
    var ptrn1= /([0-9]+(?:\.[0-9]+)?) m3/;
    var ptrn2= /([0-9]+(?:\.[0-9]+)?)/;
    var ptrn3= /[\s,]+/;

    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
    var params=[];
    if (data.CounterToday) {
        var res= ptrn1.exec(data.CounterToday);
        var usage=0;
        if (res != null) {usage=res[1]}

        if (!usage) {
            usage = 0;
        }
        params.push({"key": "Watts", "value": usage.toString(),"unit":"m3"});
    }
    if (data.Data) {
        var res=ptrn2.exec(data.Counter);
        var total=0;
        if (res != null) {total = Math.ceil(res[1]);}
        params.push({"key": "ConsoTotal", "value": total.toString(),"unit":"m3"});
    }
    myfeed.params=params;
    return(myfeed);
}
function DevWater(data) {
    room_tab.Utility=1;
    var ptrn1= /(\d+) Liter/;
    var ptrn2= /([0-9]+(?:\.[0-9]+)?) Liter/;
    var ptrn2b= /([0-9]+(?:\.[0-9]+)?) m3/;
    var ptrn3= /[\s,]+/;
    var combo=[];
    var usage_l=0;

    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
    var params=[];
    if (data.CounterToday) {
        var res= ptrn1.exec(data.CounterToday);
        var usage=0;
        if (res != null) {usage=Number(res[1]);usage_l=Number(res[1]);}

        if (!usage) {
            usage = 0;
        }
        params.push({"key": "Watts", "value": usage.toString(), "unit": "l", "graphable": "false"});
    }
    if (data.Data) {
        var res=ptrn2b.exec(data.Counter);
        var total=0;
        if (res != null) {total = Number(res[1]);}
        params.push({"key": "ConsoTotal", "value": total.toString(), "unit": "m3", "graphable": "true"});
    }
    myfeed.params=params;
    //combo.push(myfeed);
    /*var myfeed = {"id": data.idx+"_1", "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
    params=[];
    params.push({"key": "Value", "value": usage_l, "unit": "L", "graphable": "true"});
    myfeed.params=params;
    combo.push(myfeed);*/
    return(myfeed);
}
function DevFlow(data) {
    room_tab.Utility=1;
    var ptrn1= /(\d+) Liter/;
    var ptrn2= /([0-9]+(?:\.[0-9]+)?) Liter/;
    var ptrn2b= /([0-9]+(?:\.[0-9]+)?) m3/;
    var ptrn3= /[\s,]+/;
    var ptrn4= /([0-9]+(?:\.[0-9]+)?) l\/min/;
    var combo=[];
    var usage_l=0;

    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
    var params=[];

    var res=ptrn4.exec(data.Data);
    //console.log(res[1]);
    var total=0;
    if (res != null) {total = Number(res[1]);}
    params.push({"key": "Value", "value": total.toString(), "unit": "l/s", "graphable":true});
    myfeed.params=params;
    return(myfeed);
}
function DevTH(data) {
    room_tab.Temp=1;
    var status =0;
    switch(data.Type) {
        case 'Temp':
            var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTemperature", "room": "Temp"};
            params=[];
            params.push({"key": "Value", "value": data.Temp});
            params.push({"key": "unit", "value": "°C"});
            params.push({"key": "graphable", "value": "true"});
            myfeed.params=params;
            return(myfeed);
        case 'Humidity':
            var myfeed = {"id": data.idx, "name": data.Name, "type": "DevHygrometry", "room": "Temp"};
            params=[];
            params.push({"key": "Value", "value": data.Humidity, "unit": "%", "graphable": "true"});
            myfeed.params=params;
            return(myfeed);
        case 'Temp + Humidity':
            var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTempHygro", "room": "Temp"};
            var params=[];
            params.push({"key": "Hygro", "value": data.Humidity, "unit": "%", "graphable": "true"});
            params.push({"key": "Temp", "value": data.Temp, "unit": "°C", "graphable": "true"});
            myfeed.params=params;
            return(myfeed);
        case 'Temp + Humidity + Baro':
            var combo=[];
            var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTempHygro", "room": "Temp"};
            var params=[];
            params.push({"key": "Hygro", "value": data.Humidity, "unit": "%", "graphable": "true"});
            params.push({"key": "Temp", "value": data.Temp, "unit": "°C", "graphable": "true"});
            myfeed.params=params;
            combo.push(myfeed);
            room_tab.Weather=1;
            var myfeed = {"id": data.idx+"_1", "name": data.Name, "type": "DevPressure", "room": "Weather"};
            params=[];
            params.push({"key": "Value", "value": data.Barometer, "unit": "mbar", "graphable": "true"});
            myfeed.params=params;
            combo.push(myfeed);
            return(combo);
            return(combo);
        default: logger.info("General: should not happen");break;
    }
};
function DevPressure(data) {
    room_tab.Weather=1;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevPressure", "room": "Weather"};
    params=[];
    if (data.SubType==="Pressure") {
        if (data.Pressure<800) {
            var mb=data.Pressure*1000;
            params.push({"key": "Value", "value": mb, "unit": "mbar", "graphable": "true"});
        } else {
            params.push({"key": "Value", "value": data.Pressure, "unit": "bar", "graphable": "true"});
        }

    } else {
        if (data.Barometer<800) {
            var mb=data.Barometer*1000;
            params.push({"key": "Value", "value": mb, "unit": "mbar", "graphable": "true"});
        } else {
            params.push({"key": "Value", "value": data.Barometer, "unit": "bar", "graphable": "true"});
        }
    }

    myfeed.params=params;
    return (myfeed);
}
function DevRain(data) {
    var status = 0;
    room_tab.Weather=1;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevRain", "room": "Weather"};
    var params=[];
    params.push({"key": "Accumulation", "value": data.Rain, "unit": "mm", "graphable": "true"});
    params.push({"key": "Value", "value": data.RainRate, "unit": "mm/h", "graphable": "true"});
    myfeed.params=params;
    return (myfeed);
};
function DevUV(data) {
    var status = 0;
    room_tab.Weather=1;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevUV", "room": "Weather"};
    params=[];
    params.push({"key": "Value", "value": data.UVI, "unit": "", "graphable": "true"});
    myfeed.params=params;
    return (myfeed);
};
function DevNoise(data) {
    room_tab.Utility=1;
    var ptrn=/([0-9]+(?:\.[0-9]+)?) ?(.+)/;
    var res=data.Data.match(ptrn).slice(1);
    var value=res[0];
    var suffix=res[1];
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevNoise", "room": "Utility"};
    params=[];
    params.push({"key": "Value", "value": value, "unit": suffix.toString(), "graphable": "true"});
    myfeed.params=params;
    return (myfeed);
};
function DevLux(data) {
    room_tab.Weather=1;
    var ptrn1= /(\d+) Lux/;
    var res= ptrn1.exec(data.Data);
    var usage=0;
    if (res != null) {usage=res[1]}
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevLuminosity", "room": "Weather", params:[]};
    params=[];
    params.push({"key": "Value", "value": usage, "unit": "lux", "graphable": "true"});
    myfeed.params=params;
    return (myfeed);
};
function DevGases(data) {
    room_tab.Temp=1;
    var ptrn1= /(\d+) ppm/;
    var res= ptrn1.exec(data.Data);
    var usage=0;
    if (res != null) {usage=Number(res[1]);}
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2", "room": "Temp", params:[] };
    params=[];
    params.push({"key": "Value", value: usage.toString(), "unit": "ppm", "graphable": "true"});
    myfeed.params=params;
    return (myfeed);
};
function DevWind(data) {
    room_tab.Weather=1;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevWind", "room": "Weather"};
    var params=[];
    params.push({"key": "Speed", "value": data.Speed, "unit": "km/h", "graphable": "true"});
    params.push({"key": "Direction", "value": data.Direction.toString(), "unit": "°", "graphable": "true"});
    myfeed.params=params;
    return (myfeed);
};
function DevThermostat(data) {
    room_tab.Utility=1;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevThermostat", "room": "Utility"};
    var params=[];
    params.push({"key":"cursetpoint","value":data.SetPoint.toString()});
    params.push({"key":"curtemp","value":data.SetPoint.toString()});
    params.push({"key":"step","value": "0.5"});
    params.push({"key":"curmode","value":"default"});
    params.push({"key":"availablemodes","value":"default"});
    myfeed.params=params;
    return(myfeed);

};
function DevScene(data) {
    room_tab.Scenes=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": "SC"+data.idx, "name": data.Name, "type": "DevScene", "room": "Scenes"};
    params=[];
    params.push({"key": "LastRun", "value": dt});
    myfeed.params=params;
    return(myfeed);
};
function DevSceneGroup(data) {
    room_tab.Scenes=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": "SC"+data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": "Scenes"};
    var params=[];
    params.push({"key": "LastRun", "value": dt});
    params.push({"key": "Value", "value": data.Status});
    params.push({"key": "Choices", "value": "Mixed,On,Off"});
    myfeed.params=params;
    return(myfeed);
};

function DevMultiSwitchHeating(data) {
    var ptrn4= /[\s]+|/;
    room_tab.Switches=1;
    var dt=moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": "Switches"};
    var params=[];
    params.push({"key": "LastRun", "value": dt});
    var status;
    //console.log("L:"+data.Level);
    var mydev={MaxDimLevel : null,Action:10,graph:null,Selector:"Normal,Auto,AutoWithEco,Away,DayOff,Custom,HeatingOff"};
    //console.log(mydev);
    device_tab[data.idx]=mydev;
    var lvl=(data.Level)/10;
    params.push({"key": "Value", "value": data.Status.toString()});
    params.push({"key": "Choices", "value": "Normal,Auto,AutoWithEco,Away,DayOff,Custom,HeatingOff"});
    myfeed.params=params;
    return(myfeed);
};

function getDeviceType(deviceId) {
    var url=domo_path +"/json.htm?type=devices&rid=" + deviceId;
    var res = requester('GET',url);
    var js=JSON.parse(res.body.toString('utf-8'));
    return(js.result[0].Type);
};

var auth = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    };

    if (user.name === 'foo' && user.pass === 'bar') {
        return next();
    } else {
        return unauthorized(res);
    };
};

//routes
/*app.get('/a', auth, function (req, res) {

        res.sendStatus(200,'Authenticated ');

});*/

app.get('/', function(req, res) {

	// ejs render automatically looks in the views folder
	res.render('index', {
        node_version: process.version,
        app_name: app_name,
        domo_path: domo_path,
        mdah_ver: ver,
        my_ip: my_ip,
        my_port:app.get('port')
    });
});

app.get("/system", function(req, res){
    var version=app_name;
    res.type('json');
    var latest=getLastVersion();
    res.json(
	 { "id":version , "apiversion": 1 });
});

app.get("/rooms", function(req, res){
    //TODO: add hidden rooms
    res.type('json');
    var room=[];
    for(property in room_tab) {
        room.push({id:property, name:property});
    }
    var rooms={};
    rooms.rooms=room;
    res.json(rooms);
});

//get '/devices/:deviceId/action/:actionName/?:actionParam?'
app.get("/devices/:deviceId/action/:actionName/:actionParam?", function(req, res) {
    res.type('json');
    var deviceId = req.params.deviceId;
    var actionName = req.params.actionName;
    var actionParam = req.params.actionParam;
    switch (actionName) {
        case 'pulse':
            res.type('json');
            var options = {
                url: domo_path + "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&level=0&passcode=",
                headers: {
                    'User-Agent': 'request'
                }
            };
            logger.info(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'setStatus':
            var action;
            if (actionParam == 1) {
                action = "On";
            } else {
                action = "Off";
            }
            res.type('json');
            var options = {
                url: domo_path + "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=" + action + "&level=0&passcode=",
                headers: {
                    'User-Agent': 'request'
                }
            };
            //console.log(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'setArmed':
            res.status(500).send({success: false, errormsg: 'not implemented'});
            break;
        case 'setAck':
            res.type('json');
            var options = {
                url: domo_path + "/json.htm?type=command&param=resetsecuritystatus&idx=" + deviceId + "&switchcmd=Normal",
                headers: {
                    'User-Agent': 'request'
                }
            };
            //console.log(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'setLevel':
            var my_url;
            var lsetLevel;
            logger.info(device_tab[deviceId]);
            switch (device_tab[deviceId].Action) {
                case 1: //on/off
                    if (actionParam == 1) {
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&level=" + actionParam + "&passcode=";
                    } else if (actionParam == 0) {
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&level=" + actionParam + "&passcode=";
                    }
                    break;
                case 2: //blinds
                case 3: //security
                    if (actionParam == 100) {
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&level=" + actionParam + "&passcode=";
                    } else {
                        lsetLevel = Math.ceil(actionParam * (device_tab[deviceId].MaxDimLevel) / 100);
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&level=" + lsetLevel + "&passcode=";
                    }
                    break;
                case 5:
                    //Blinds inverted
                    if (actionParam == 100) {
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&level=0&passcode=";
                    } else {
                        lsetLevel = Math.ceil(actionParam * (device_tab[deviceId].MaxDimLevel) / 100);
                        logger.info(actionParam+" "+lsetLevel);
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&level=" + lsetLevel + "&passcode=";
                    }
                    break;
                case 6:
                    //Blinds -> On for Closed, Off for Open
                    if (actionParam == 100) {
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&level=" + actionParam + "&passcode=";
                    } else {
                        my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&level=" + actionParam + "&passcode=";
                    }
                    break;
                default:
                    lsetLevel = Math.ceil(actionParam * (device_tab[deviceId].MaxDimLevel) / 100);
                    my_url = "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Set%20Level&level=" + lsetLevel + "&passcode=";
                    break;
            }
            res.type('json');
            var options = {
                url: domo_path + my_url,
                headers: {
                    'User-Agent': 'request'
                }
            };
            logger.info(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'stopShutter':
            res.type('json');
            var options = {
                url: domo_path + "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Stop&level=0&passcode=",
                headers: {
                    'User-Agent': 'request'
                }
            };
            //console.log(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'pulseShutter':
            res.status(500).send({success: false, errormsg: 'not implemented'});
            break;
        case 'setSetPoint':
            res.type('json');
            var options = {
                url: domo_path + "/json.htm?type=setused&idx=" + deviceId + "&used=true&setpoint=" + actionParam,
                headers: {
                    'User-Agent': 'request'
                }
            };
            //console.log(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'launchScene':
            res.type('json');
            var sc = deviceId.match(/^SC(\d+)/);
            //console.log(sc[1]);
            var options = {
                url: domo_path + "/json.htm?type=command&param=switchscene&idx=" + sc[1] + "&switchcmd=On&passcode=",
                headers: {
                    'User-Agent': 'request'
                }
            };
            //console.log(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'setColor':
            res.type('json');
            var options = {
                url: domo_path + "/json.htm?type=command&param=setcolbrightnessvalue&idx=" + deviceId + "&hex="+actionParam.substr(2,6).toUpperCase(),
                headers: {
                    'User-Agent': 'request'
                }
            };
            logger.info(options.url);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    if (data.status == 'OK') {
                        res.status(200).send({success: true});
                    } else {
                        res.status(500).send({success: false, errormsg: data.message});
                    }
                } else {
                    res.status(500).send({success: false, errormsg: 'error'});
                }
            });
            break;
        case 'setChoice':
            if (deviceId.match(/^S/)) {
                var sc = deviceId.match(/^SC(\d+)/);
                res.type('json');
                var options = {
                    url: domo_path + "/json.htm?type=command&param=switchscene&idx=" + sc[1] + "&switchcmd=" + actionParam + "&passcode=",
                    headers: {
                        'User-Agent': 'request'
                    }
                };
                //console.log(options.url);
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var data = JSON.parse(body);
                        if (data.status == 'OK') {
                            res.status(200).send({success: true});
                        } else {
                            res.status(500).send({success: false, errormsg: data.message});
                        }
                    } else {
                        res.status(500).send({success: false, errormsg: 'error'});
                    }
                });
                break;
            } else if (device_tab[deviceId].Action === 10) {
                res.type('json');
                var level = 0;
                //console.log(device_tab[deviceId].Selector);
                //console.log(device_tab[deviceId].Selector.indexOf(actionParam));
                level=device_tab[deviceId].Selector.indexOf(actionParam)*10;
                //console.log("level="+level);
                var options = {
                    url: domo_path + "/json.htm?type=command&param=switchmodal&idx=" + deviceId + "&status="+actionParam+"&action=1",
                    headers: {
                        'User-Agent': 'request'
                    }
                };
                logger.info(options.url);
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var data = JSON.parse(body);
                        if (data.status == 'OK') {
                            res.status(200).send({success: true});
                        } else {
                            res.status(500).send({success: false, errormsg: data.message});
                        }
                    } else {
                        res.status(500).send({success: false, errormsg: 'error'});
                    }
                });
                break;
            } else {
                res.type('json');
                var level = 0;
                //console.log(device_tab[deviceId].Selector);
                //console.log(device_tab[deviceId].Selector.indexOf(actionParam));
                level=device_tab[deviceId].Selector.indexOf(actionParam)*10;
                //console.log("level="+level);
                var options = {
                    url: domo_path + "/json.htm?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Set%20Level&level=" + level + "&passcode=",
                    headers: {
                        'User-Agent': 'request'
                    }
                };
                logger.info(options.url);
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var data = JSON.parse(body);
                        if (data.status == 'OK') {
                            res.status(200).send({success: true});
                        } else {
                            res.status(500).send({success: false, errormsg: data.message});
                        }
                    } else {
                        res.status(500).send({success: false, errormsg: 'error'});
                    }
                });
                break;
            }
        case 'setMode':
            res.status(403).send({success:false,errormsg:'not implemented'});
            break;
        default:
            logger.warn("unknown action: " + deviceId + " " + actionName + " " + actionParam);
            res.status(403).send({success:false,errormsg:'not implemented'});
            break;
    }

});

app.get("/devices/:deviceId/:paramKey/histo/:startdate/:enddate", function(req, res) {
    res.type('json');
    var deviceId = req.params.deviceId;
    var paramKey = req.params.paramKey;
    var startdate = req.params.startdate;
    var enddate = req.params.enddate;
    var duration = (enddate - startdate) / 1000;

    var PLine='';
    if (deviceId.match(/L/)) {
        var pid;
        pid = deviceId.match(/(\d+)_L(.)/);
        deviceId = pid[0];
        PLine = pid[1]||'';
    }
    var type = getDeviceType(deviceId).toLowerCase();
    var ptype = type;var curl="&method=1";;

    if ((type === "lux") || (type === "energy")) {
        type = "counter";curl="&method=1";
    }
    if (type === "air quality") {
        type = "counter";
    }
    if ((ptype === "general")) {
        //type = "Percentage";
        type = "counter";
    }
    if ((paramKey === "hygro")) {
        type = "temp";
    }
    if ((paramKey === "temp")) {
        type = "temp";
    }
    if ((paramKey === "Watts")) {
        type = "counter";
    }
    logger.info(deviceId + PLine + type);
    var range;
    if (duration <= 172800) {
        range = "day";
    } else if (duration < 1209600) {
        range = "week";
    } else if (duration < 5270400) {
        range = "month";
    } else {
        range = "year";
    }
    res.type('json');
    var options = {
        url: domo_path + "/json.htm?type=graph&sensor="+type+curl+"&idx="+deviceId+"&range="+range,
        headers: {
            'User-Agent': 'request'
        }
    };
    logger.info(options.url);
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var result = [];
            var params=[];
            var lastEu;
            //TODO: http://192.168.0.28:8080/json.htm?type=graph&sensor=humidity&idx=243&range=day
            logger.info(data);
            if (! data.result) {
                var feeds = {"date": startdate, "value": 0};
                params.push(feeds);
                var rest = {};
                rest.values = params;
                res.json(rest);
            }
            for (var i = 0; i < data.result.length; i++) {
                //console.log(data.result[i].lux);
                if ((paramKey === "temp") && (data.result[i].te)) {
                    var value = data.result[i].te;
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if (((paramKey === "hygro") && (data.result[i].hu)) || (type === "Humidity")) {
                    var value = data.result[i].hu;
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if (ptype === "air quality") {
                    var value = data.result[i].co2;
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if (data.result[i].mm) {
                    var value = data.result[i].mm;
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if ((data.result[i].lux)||(data.result[i].lux_max)) {
                    var value = (data.result[i].lux||(data.result[i].lux_max));
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if (data.result[i].uvi) {
                    var value = data.result[i].uvi;
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if (data.result[i].v) {
                    var value = data.result[i].v;
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if (data.result[i].sp) {
                    var value = data.result[i].sp;
                    var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    var feeds = {"date": dt, "value": value};
                    params.push(feeds);
                } else if ((type === "counter") || (type === "Percentage")) {
                    var value;
                    if (PLine) {
                        value = eval(data.result[i] + ".v" + PLine);
                    } else {
                        value=(data.result[i].v||data.result[i].v_max);
                    }
                    if (data.result[i].v2) {
                        value = value + data.result[i].v2;
                    }
                    var date = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                    if (data.result[i].eu) {
                        if ((value > 0) || ((data.result[i].eu - lastEu) > 0)) {
                            var feeds = {"date": date, "value": value};
                            params.push(feeds);
                        }
                        lastEu = data.result[i].eu;
                    } else {
                        var feeds = {"date": date, "value": value};
                        params.push(feeds);
                    }
                } else {
                    logger.warn("UNK");
                }
            }
            var rest = {};
            rest.values = params;
            res.json(rest);
        } else {
            //TODO
            res.status(403).send({success: false, errormsg: 'not implemented'});
        }
    });
});

app.get("/devices", function(req, res){
    res.type('json');    
    var options = {
    url: domo_path+"/json.htm?type=devices&filter=all&used=true&order=Name",
	  headers: {
	  'User-Agent': 'request'
          }
    };
    //console.log(options.url);
    request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var data=JSON.parse(body);
        var result = [];
        //my ID string
        var myfeed = {"id": "S0", "name": "MyDomoAtHome", "type": "DevGenericSensor"};
        var params=[];
        params.push({"key": "Value", "value": ver, "unit": "", "graphable": "false"});
        myfeed.params=params;
        result.push(myfeed);
        if (ver != getLastVersion()) {
            var myfeed = {"id": "S1", "name": "New version found", "type": "DevGenericSensor"};
            var params=[];
            params.push({"key": "Value", "value": last_version, "unit": "", "graphable": "false"});
            myfeed.params=params;
            result.push(myfeed);
        }
        for(var i = 0; i < data.result.length; i++) {
            //console.log(data.result[i].Type);
            switch(data.result[i].Type) {
                case (data.result[i].Type.match(/Light/)||{}).input:
                    switch(data.result[i].SwitchType) {
                        case 'On/Off':
                        case 'Contact':
                        case 'Dusk Sensor':
                            if (data.result[i].SubType =='RGB') {
                                result.push(DevRGBLight(data.result[i]));
                            } else if (data.result[i].SubType =='RGBW') {
                                result.push(DevRGBLight(data.result[i]));
                            } else  {
                                result.push(DevSwitch(data.result[i]));
                            }
                            break;
                        case 'Push On Button':
                        case 'Push Off Button':
                            result.push(DevPush(data.result[i]));
                            break;
                        case 'Dimmer':
                            if (data.result[i].SubType =='RGB') {
                                //console.log("OK"+data.result[i].SubType);
                                result.push(DevRGBLight(data.result[i]));
                            } else if (data.result[i].SubType =='RGBW') {
                                //console.log("OK"+data.result[i].SubType);
                                result.push(DevRGBLight(data.result[i]));
                            } else  {
                                result.push(DevDimmer(data.result[i]));
                            }
                            break;
                        case 'Doorbell':
                            result.push(DevDimmer(data.result[i]));
                            break;
                        case 'Blinds Inverted':
                        case 'Blinds Percentage Inverted':
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
                        case 'Selector':
                            result.push(DevMultiSwitch(data.result[i]));
                            break;
                        case 'Media Player':
                            //TODO
                            break;
                        default:
                            logger.warn("UNK Sw "+data.result[i].Name);
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
                            logger.warn("UNK Sec "+data.result[i].Name);
                            break;
                    }
                    break;
                case 'P1 Smart Meter':
                    switch(data.result[i].SubType) {
                        case 'Energy':
                            var rt=DevElectricity(data.result[i]);
                            for(var ii = 0; ii < rt.length; ii++) {
                                result.push(rt[ii]);
                            }
                            break;
                        case 'Gas':
                            result.push(DevGas(data.result[i]));
                            break;
                        default:
                    }
                    break;
                case 'Lighting Limitless/Applamp':
                    //console.log(data.result[i].SubType);
                    result.push(DevRGBLight(data.result[i]));
                    break;
                case 'YouLess Meter':
                    switch(data.result[i].SubType) {
                        case 'YouLess counter':
                            result.push(DevElectricity(data.result[i]));
                            break;
                        default:
                            logger.warn("UNK Sec "+data.result[i].Name);
                            break;
                    }
                    break;
                case 'Energy':
                    result.push(DevElectricity(data.result[i]));
                    break;
                case 'Usage':
                    result.push(DevElectricity(data.result[i]));
                    break;
                case 'Current':
                    //TODO
                    result.push(DevElectricity(data.result[i]));
                    break;
                case 'Current/Energy':
                    var rt=DevElectricityMultiple(data.result[i]);
                    for(var ii = 0; ii < rt.length; ii++) {
                        result.push(rt[ii]);
                    }
                    break;
                case 'Temp':
                case 'Temp + Humidity':
                case 'Humidity':
                    result.push(DevTH(data.result[i]));
                    break;
                case 'Temp + Humidity + Baro':
                    var rt=DevTH(data.result[i]);
                    for(var ii = 0; ii < rt.length; ii++) {
                        result.push(rt[ii]);
                    }
                    break;
                case 'Rain':
                    result.push(DevRain(data.result[i]));
                    break;
                case 'UV':
                    result.push(DevUV(data.result[i]));
                    break;
                case 'Lux':
                    result.push(DevLux(data.result[i]));
                    break;
                case 'Air Quality':
                    result.push(DevGases(data.result[i]));
                    break;
                case 'Wind':
                    result.push(DevWind(data.result[i]));
                    break;
                case 'RFXMeter':
                    switch(data.result[i].SwitchTypeVal) {
                        case 1:
                            result.push(DevGas(data.result[i]));
                            break;
                        case 2:
                            var rt=DevWater(data.result[i]);
                            for(var ii = 0; ii < rt.length; ii++) {
                                result.push(rt[ii]);
                            }
                            break;
                        case 3:
                            result.push(DevElectricity(data.result[i]));
                            break;
                        default:
                            logger.warn("RFX Unknown "+data.result[i].Name+" "+data.result[i].SubType);
                    }
                    break;
                case 'General':
                    switch(data.result[i].SubType) {
                        case 'Percentage':
                            result.push(DevGenericSensorT(data.result[i]));
                            break;
                        case 'Voltage':
                        case 'Current':
                            result.push(DevGenericSensorT(data.result[i]));
                            break;
                        case 'kWh':
                            result.push(DevElectricity(data.result[i]));
                            break;
                        case 'Pressure':
                        case 'Barometer':
                            result.push(DevPressure(data.result[i]));
                            break;
                        case 'Visibility':
                        case 'Solar Radiation':
                            result.push(DevGenericSensorT(data.result[i]));
                            break;
                        case 'Text':
                        case 'Alert':
                            result.push(DevGenericSensor(data.result[i]));
                            break;
                        case 'Unknown':
                            logger.warn("Unknown "+data.result[i].Name+" "+data.result[i].SubType);
                            break;
                        case 'Waterflow':
                            result.push(DevFlow(data.result[i]));
                            break;
                        case 'Sound Level':
                            result.push(DevNoise(data.result[i]));
                            break;
                        case 'Counter Incremental':
                            result.push(DevCounterIncremental(data.result[i]));
                            break;
                        case 'Custom Sensor':
                            result.push(DevGenericSensor(data.result[i]));
                            break;
                        default:
                            logger.warn("General Unknown "+data.result[i].Name+" "+data.result[i].SubType);
                            break;
                    }
                    break;
                case 'Heating':
                    switch(data.result[i].SubType) {
                        case 'Evohome':
                            result.push(DevMultiSwitchHeating(data.result[i]));
                            break;
                        /*case 'Zone':
                            break;
                        case 'Hot Water':
                            break;*/
                        default:
                            logger.warn("General Unknown "+data.result[i].Name+" "+data.result[i].SubType);
                            break;
                    }
                    break;
                case 'Thermostat':
                    result.push(DevThermostat(data.result[i]));
                    break;
                case 'Scene':
                    result.push(DevScene(data.result[i]));
                    break;
                case 'Group':
                    result.push(DevSceneGroup(data.result[i]));
                    break;
                default:
                    logger.warn("Unknown type "+data.result[i].Type);
                    break;
                }
            }
            var rest={};
            rest.devices=result;
            res.json(rest);
        } else {
            var result=[];
            result.push(DevGenericSensor({idx:'S00',Name:"Unable to connect to Domoticz","Data":nconf.get('domo_path')}))
            result.push(DevGenericSensor({idx:'S01',Name:"Please add this gateway in Setup/settings/Local Networks","Data":""}))
            var rest={};
            rest.devices=result;
            res.json(rest);

        }
    })
});

//get '/devices/:deviceId/:paramKey/histo/:startdate/:enddate'

// error handling middleware should be loaded after the loading the routes
// all environments


logger.info("Domoticz server: "+domo_path);
logger.info("Node version: "+process.versions.node);
logger.info("MDAH version: "+app_name+" "+ver);
logger.info("OS version: "+os.type()+" "+os.platform()+" "+os.release());
var interfaces = os.networkInterfaces();
var addresses = [];
var my_ip;
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
            my_ip=address.address;
        }
    }
}

if (versionCompare(process.versions.node,'1.0.0')<0) {
	logger.info("Hostname: "+os.hostname()+" "+my_ip);
} else {
	logger.info("Hostname: "+os.hostname()+" "+my_ip+" in "+os.homedir());
}
/*nconf.save(function (err) {
    if (err) {
        console.error(err.message);
        return;
    }
    //console.log('Configuration saved successfully.');
}
);*/
process.once('SIGUSR2', function () {
  gracefulShutdown(function () {
    process.kill(process.pid, 'SIGUSR2');
  });
});
process.once('SIGINT', function () {
    gracefulShutdown(function () {
        process.kill(process.pid, 'SIGINT');
    });
});

// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
var gracefulShutdown = function() {
    logger.warn("Received kill signal, shutting down gracefully.");
    server.close(function() {
        logger.warn("Closed out remaining connections.");
        process.exit()
    });
    // if after
    setTimeout(function() {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit()
    }, 2*1000);
}
//start server
var server = http.createServer(app);
server.listen(app.get('port'), function(){
    logger.info('MDAH port: ' + app.get('port'));
});

server.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    logger.info('Address in use, retrying...');
    
    setTimeout(function () {
      server.close();
      server.listen(port);
    }, 2000);
  }
});
