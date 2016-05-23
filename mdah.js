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
var nconf = require('nconf');
var fs = require('fs');
var os = require("os");
var moment = require('moment');
var morgan = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth');
var errorHandler = require('errorhandler');
var requester = require('sync-request');
var winston = require('winston');
var pjson = require('./package.json');
var app = express();
global.logger = winston;


//working variaboles
var last_version_dt;
var last_version = getLastVersion();
var ver = pjson.version;
var device_tab = {};
var room_tab = [];
var domo_room_tab = [];
var device = {MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected:null};
var app_name = "MyDomoAtHome";
var port = process.env.PORT || '3002';
var passcode=process.env.SEC||'';

//configuration
app.set('port', port);
app.set('view engine', 'ejs');
var home = process.env.MDAH_HOME || path.resolve(__dirname + "/..");
app.use(express.static(path.join(__dirname + '/public')));
app.set('views', path.resolve(__dirname + '/views'));
app.use(morgan('combined'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
logger.add(winston.transports.File, {filename: '/var/log/mydomoathome/usage.log'});

function onError(error) {
    if (error) {
        logger.warn("No global conf in /etc/mydomoathome:" + err.message);
    }
}
function loadLocalConf() {
    // load conf file
    if (fileExists('./config.json')) {
        try {
            nconf.use('file', {file: './config.json'}, onError);
        } catch (err) {
            // This will not catch the throw!
            logger.error("Global conf parsing issue !");
            logger.error(err);
            return;
        }
    }
}
function loadGlobalConf() {
    try {
        nconf.use('file', {file: '/etc/mydomoathome/config.json'}, onError);
    } catch (err) {
        // This will not catch the throw!
        logger.error("Global conf parsing issue !");
        logger.error(err);
        return;
    }
}
function loadConf() {
    try {
        nconf.load(function (err) {
            if (err) {
                logger.warn("Conf load error:" + err.message);
                return;
            }
        });
    } catch (err) {
        // This will not catch the throw!
        logger.error("Global conf load issue !");
        logger.error(err);
        return;
    }
}
function getConf(){
    if (!(nconf.get('port') || (nconf.get('app_name')))) {
        logger.warn('basic configuration not found in /etc/mydomoathome/config.json, defaulting')
    } else {
        app.set('port', process.env.PORT || nconf.get('port'));
        app_name = nconf.get('app_name') || "MyDomoAtHome";
        passcode = nconf.get('passcode') || passcode;
    }
    if (!(nconf.get('domoticz:host') || (nconf.get('domoticz:port')))) {
        logger.warn('domoticz access configuration not found in /etc/mydomoathome/config.json, defaulting')
    }
}
loadLocalConf();
loadGlobalConf();
loadConf();
getConf();


if (nconf.get("debug") === true)
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
    extended: false
}));

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (err) {
        return false;
    }
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
function getURL() {
  var protocole = nconf.get('domoticz:ssl') === true ? 'https' : 'http';
  var host = nconf.get('domoticz:host')||'127.0.0.1';
  var port = nconf.get('domoticz:port')||'8080';
  var path = nconf.get('domoticz:path')||'/';
  var oldpath = nconf.get('domo_path');
  var cmd = "json.htm";

  // In case of AUTH Basic authentication
  var secure = false;
  if (nconf.get('domoticz:auth') && nconf.get('domoticz:auth:username') && nconf.get('domoticz:auth:password')) {
    var secure = nconf.get('domoticz:auth:username') + ":" + nconf.get('domoticz:auth:password') + "@";
  }

  if (secure) {
    var url = protocole + '://' + secure + host + ':' + port + path + cmd;
  } else {
    var url = protocole + '://' + host + ':' + port + path + cmd;
  }
  if (process.env.DOMO) {
      return process.env.DOMO+"/json.htm";
  } else if (oldpath) {
      return oldpath+"/json.htm";
  } else {
      return url;
  }
};
function getLastVersion() {
    var now = moment();
    if (typeof last_version_dt !== 'undefined' && last_version_dt !== null  && (last_version_dt.isBefore(moment().add(2, 'h')))) {
        return (last_version);
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
                last_version_dt = now;
                last_version = data.tag_name;
                logger.info("Refreshing version cache: "+data.tag_name);
                return (data.tag_name);
            } else {
                return ("unknown");
            }
        });
    }
}
function devSt(data) {
    var rbl;
    var dimmable;
    if (data.HaveDimmer === 'true') {
        dimmable = 1
    } else {
        dimmable = 0
    }
    var deviceId = data.deviceId;
    switch (data.Status) {
        case "On":
            rbl = 1;
            var mydev = device_tab[deviceId];
            if (mydev) {
                if (dimmable) {
                    mydev.Action = 0;
                    mydev.MaxDimLevel = data.MaxDimLevel;
                } else {
                    mydev.Action = 1;
                }
                device_tab[deviceId] = mydev;
            } else {
                mydev = {MaxDimLevel: null, Action: 1, graph: null, Selector: null};
            }
            device_tab[deviceId] = mydev;
            break;
        case "Off":
            rbl = 0;
            var mydev = device_tab[deviceId];
            if (mydev) {
                if (dimmable) {
                    mydev.Action = 0;
                    mydev.MaxDimLevel = data.MaxDimLevel;
                } else {
                    mydev.Action = 1;
                }
                device_tab[deviceId] = mydev;
            } else {
                mydev = {MaxDimLevel: null, Action: 1, graph: null, Selector: null};
            }
            device_tab[deviceId] = mydev;
            break;
        case "Open":
            rbl = 1;
            var mydev = device_tab[deviceId];
            if (mydev) {
                mydev.Action = 2;
                device_tab[deviceId] = mydev;
            } else {
                mydev = {MaxDimLevel: null, Action: 2, graph: null, Selector: null};
            }
            device_tab[deviceId] = mydev;
            break;
        case "Closed":
            rbl = 0;
            var mydev = device_tab[deviceId];
            if (mydev) {
                mydev.Action = 2;
                device_tab[deviceId] = mydev;
            } else {
                mydev = {MaxDimLevel: null, Action: 2, graph: null, Selector: null};
            }
            device_tab[deviceId] = mydev;
            break;
        case "Panic":
            rbl = 1;
            var mydev = device_tab[deviceId];
            if (mydev) {
                mydev.Action = 3;
                device_tab[deviceId] = mydev;
            } else {
                mydev = {MaxDimLevel: null, Action: 3, graph: null, Selector: null};
            }
            device_tab[deviceId] = mydev;
            break;
        case "Normal":
            rbl = 0;
            var mydev = device_tab[deviceId];
            if (mydev) {
                mydev.Action = 3;
                device_tab[deviceId] = mydev;
            } else {
                mydev = {MaxDimLevel: null, Action: 3, graph: null, Selector: null};
            }
            device_tab[deviceId] = mydev;
            break;
        default:
            rbl = data.Status;
            break;
    }
    return rbl;
}

function DevSwitch(data) {

    var status = 0;
    switch (data.Status) {
        case 'On':
        case 'Open':
        case 'Panic':
        case 'All On':
            status = 1;
            break;
        case 'Normal':
        case 'Off':
        case 'Closed':
        case 'All Off':
            status = 0;
            break;
        default:
            status = 0;
            break;
    }
    //Protected device
    var mydev = device_tab[data.idx]||{MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected: null};
    if (! mydev && (data.Protected === 'true')) {
            mydev.Protected = 1;
        }
    device_tab[data.idx] = mydev;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    params.push({"key": "Status", "value": status.toString()});
	if(data.Energy) {
		params.push({"key": "Energy", "value": data.Energy});
	}
    //TODO key Energy
    myfeed.params = params;
    return (myfeed);
}

function DevMultiSwitch(data) {
    var ptrn4 = /[\s]+|/;

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": "Switches"};

    //Protected device
    var mydev = device_tab[data.idx]||{MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected: null};
    if (! mydev && (data.Protected === 'true')) {
        mydev.Protected = 1;
    }
    device_tab[data.idx] = mydev;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    var params = [];
    params.push({"key": "LastRun", "value": dt});
    var status;
    //console.log("L:"+data.Level);
    var res = data.LevelNames.split('|').join(',');
	
	if(data.LevelOffHidden) {
		res = res.replace ("Off,","");
	}
	
    var ret = data.LevelNames.split('|');
    var mydev = {MaxDimLevel: null, Action: null, graph: null, Selector: ret};
    //console.log(mydev);
    device_tab[data.idx] = mydev;
    var lvl = (data.Level) / 10;
    params.push({"key": "Value", "value": ret[lvl].toString()});
    params.push({"key": "Choices", "value": res});
    myfeed.params = params;
    return (myfeed);
};

function DevPush(data) {

    var status = 0;
    switch (data.SwitchType) {
        case 'Push On Button':
            status = 1;
            break;
        case 'Push Off Button':
            status = 0;
            break;
        default:
            status = 0;
            break;
    }

    //Protected device
    var mydev = device_tab[data.idx]||{MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected: null};
    if (! mydev && (data.Protected === 'true')) {
        mydev.Protected = 1;
    }
    device_tab[data.idx] = mydev;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSwitch", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    //params.push({"key": "Status", "value": status.toString()});
    params.push({"key": "pulseable", "value": "1"});
    myfeed.params = params;
    return (myfeed);
}
function DevRGBLight(data) {
    var status = 0;
    status = devSt(data);
    switch (data.SwitchType) {
        case 'Push On Button':
            status = 1;
            break;
        case 'Push Off Button':
            status = 0;
            break;
        default:
            status = 0;
            break;
    }

    //Protected device
    var mydev = device_tab[data.idx]||{MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected: null};
    if (! mydev && (data.Protected === 'true')) {
        mydev.Protected = 1;
    }
    device_tab[data.idx] = mydev;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevRGBLight", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevRGBLight", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    if (data.Status.match(/Set Level/) || (data.HaveDimmer === 'true')) {
        var mydev = {MaxDimLevel: null, Action: null, graph: null};
        if (device_tab[data.idx]) {
            mydev = device_tab[data.idx];
        }
        mydev.MaxDimLevel = data.MaxDimLevel;
        mydev.Action = 0;
        device_tab[data.idx] = mydev;
        params = [];
        params.push({"key": "Status", "value": "1"});//hyp: set level only when on
        params.push({"key": "dimmable", "value": "1"});
        params.push({"key": "Level", "value": data.Level.toString()});
		if(data.Energy) {
			params.push({"key": "Energy", "value": data.Energy});
		}
        //TODO whitechannel
        //TODO color
        //TODO Energy value unit
        myfeed.params = params;
    } else {
        params = [];
        params.push({"key": "Status", "value": status});
        myfeed.params = params;
    }
    return (myfeed);
};
function DevDimmer(data) {
    var status = 0;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDimmer", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDimmer", "room": "Switches"};
		room_tab.Switches=1;
	}

    //Protected device
    var mydev = device_tab[data.idx]||{MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected: null};
    if (! mydev && (data.Protected === 'true')) {
        mydev.Protected = 1;
    }
    device_tab[data.idx] = mydev;

    status = devSt(data);
    if (data.Status.match(/Set Level/)) {
        status = 1;
    }
    var mydev = {MaxDimLevel: null, Action: null, graph: null};
    if (device_tab[data.idx]) {
        mydev = device_tab[data.idx];
    }
    mydev.MaxDimLevel = data.MaxDimLevel;
    mydev.Action = 0;
    //console.log(mydev);
    device_tab[data.idx] = mydev;
    params = [];
    params.push({"key": "Status", "value": status.toString()});
	if(status == 0) {
		params.push({"key": "Level", "value": "0"});
	} else {
		params.push({"key": "Level", "value": data.Level.toString()});
	}
	if(data.Energy) {
		params.push({"key": "Energy", "value": data.Energy});
	}
    myfeed.params = params;
    return (myfeed);
};
function DevShutterInverted(data) {
    var status = 0;
    status = devSt(data);

    //Protected device
    var mydev = device_tab[data.idx]||{MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected: null};
    if (! mydev && (data.Protected === 'true')) {
        mydev.Protected = 1;
    }
    device_tab[data.idx] = mydev;

    var lvl = 0;
    var stoppable = 0;
    var mydev = {MaxDimLevel: null, Action: null, graph: null};
    if (device_tab[data.idx]) {
        mydev = device_tab[data.idx];
    }
    mydev.Action = 5;
    mydev.MaxDimLevel = data.MaxDimLevel;
    device_tab[data.idx] = mydev;
    //console.log(data.Status+" "+data.Level);
    if (data.Status === 'Open') {
        lvl = data.Level || 100;
        status = 1;
    } else if (data.Status.match(/Set Level/) || (data.HaveDimmer === 'true')) {
        lvl = data.Level;
        //console.log(data.status+" "+lvl);
        if (lvl > 0) {
            status = 1
        } else {
            status = 0
        }
        ;
    } else {
        lvl = data.Level || 0;
        status = 0;
    }
    ;
    //console.log(data.idx+" "+status+" "+lvl);
    if ((data.SwitchType === 'Venetian Blinds EU') || (data.SwitchType === 'Venetian Blinds US') || (data.SwitchType === 'RollerTrol, Hasta new')) {
        stoppable = 1;
    }
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    params.push({"key": "Status", "value": status});
    params.push({"key": "Level", "value": lvl.toString()});
    params.push({"key": "stopable", "value": stoppable.toString()});
    params.push({"key": "pulsable", "value": "0"});
    myfeed.params = params;
    //console.log(params);
    return (myfeed);
};
function DevShutter(data) {
    var status = 0;
    status = devSt(data);

    //Protected device
    var mydev = device_tab[data.idx]||{MaxDimLevel: null, Action: null, graph: null, Selector: null, Protected: null};
    if (! mydev && (data.Protected === 'true')) {
        mydev.Protected = 1;
    }
    device_tab[data.idx] = mydev;

    var lvl = 0;
    var stoppable = 0;
    var mydev = {MaxDimLevel: null, Action: null, graph: null};
    if (device_tab[data.idx]) {
        mydev = device_tab[data.idx];
    }
    mydev.Action = 6;
    mydev.MaxDimLevel = data.MaxDimLevel;
    device_tab[data.idx] = mydev;
    //console.log(data.Status+" "+data.Level);
    if (data.Status == 'Open') {
        lvl = 100 || data.Level;
        status = 1;
    } else if ((data.Status.match(/Set Level/) || (data.HaveDimmer === 'true') )) {
        lvl = data.Level;
        //console.log(data.status+" "+lvl);
        if (lvl > 0) {
            status = 1
        } else {
            status = 0
        }

    } else {
        lvl = data.Level || 0;
        status = 0;
    }

    //console.log(data.idx+" "+status+" "+lvl);
    if ((data.SwitchType === 'Venetian Blinds EU') || (data.SwitchType === 'Venetian Blinds US') || (data.SwitchType === 'RollerTrol, Hasta new')) {
        stoppable = 1;
    }
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevShutter", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    params.push({"key": "Status", "value": status});
    params.push({"key": "Level", "value": lvl.toString()});
    params.push({"key": "stopable", "value": stoppable.toString()});
    params.push({"key": "pulsable", "value": "0"});

    myfeed.params = params;
    return (myfeed);
}
function DevMotion(data) {

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMotion", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMotion", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMotion", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    var value = devSt(data);
    //console.log(data.Status+" "+value);
    params.push({"key": "Armable", "value": "0"});
    params.push({"key": "ackable", "value": "0"});
    params.push({"key": "Armed", "value": "1"});
    params.push({"key": "Tripped", "value": value.toString()});
    params.push({"key": "lasttrip", "value": dt.toString()});
    myfeed.params = params;
    return (myfeed);
}
function DevDoor(data) {//TODO

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    var value = devSt(data);
    params.push({"key": "armable", "value": "0"});
    params.push({"key": "Ackable", "value": "0"});
    params.push({"key": "Armed", "value": "1"});
    params.push({"key": "Tripped", "value": value.toString()});
    params.push({"key": "lasttrip", "value": dt.toString()});
    myfeed.params = params;
    return (myfeed);
}
function DevLock(data) {

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevDoor", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    var value = devSt(data);
    params.push({"key": "armable", "value": "0"});
    params.push({"key": "Ackable", "value": "0"});
    params.push({"key": "Armed", "value": "1"});
    params.push({"key": "Tripped", "value": value.toString()});
    params.push({"key": "lasttrip", "value": dt.toString()});
    myfeed.params = params;
    return (myfeed);
}
function DevSmoke(data) {

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable = 0;
    if (data.Type == 'Security') {
        ackable = 1;
    }
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSmoke", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSmoke", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevSmoke", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    var value = devSt(data);
    params.push({"key": "Armable", "value": "0"});
    params.push({"key": "ackable", "value": ackable.toString()});
    params.push({"key": "Armed", "value": "1"});
    params.push({"key": "Tripped", "value": value.toString()});
    params.push({"key": "lasttrip", "value": dt.toString()});
    myfeed.params = params;
    return (myfeed);
}
function DevFlood(data) {

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable = 0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevFlood", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevFlood", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevFlood", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    var value = devSt(data);
    params.push({"key": "armable", "value": "0"});
    params.push({"key": "Ackable", "value": ackable.toString()});
    params.push({"key": "Armed", "value": "1"});
    params.push({"key": "Tripped", "value": value.toString()});
    params.push({"key": "lasttrip", "value": dt.toString()});
    myfeed.params = params;
    return (myfeed);
}
function DevCO2(data) {

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable = 0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    var value = devSt(data);
    params.push({"key": "armable", "value": "0"});
    params.push({"key": "Ackable", "value": ackable.toString()});
    params.push({"key": "Armed", "value": "1"});
    params.push({"key": "Tripped", "value": value.toString()});
    params.push({"key": "lasttrip", "value": dt.toString()});
    myfeed.params = params;
    return (myfeed);
}
function DevCO2Alert(data) {

    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();
    var ackable = 0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2Alert", "room": "Switches"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2Alert", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2Alert", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    params = [];
    var value = devSt(data);
    params.push({"key": "armable", "value": "0"});
    params.push({"key": "ackable", "value": ackable.toString()});
    params.push({"key": "Armed", "value": "1"});
    params.push({"key": "Tripped", "value": value.toString()});
    params.push({"key": "lasttrip", "value": dt.toString()});
    myfeed.params = params;
    return (myfeed);
}

function DevGenericSensor(data) {

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
		room_tab.Utility=1;
	}
	
    if (data.Status) {
        params = [];
        params.push({"key": "Value", "value": data.Status.toString()});
        myfeed.params = params;
    } else if (data.Data) {
        params = [];
        //console.log(data;)
        params.push({"key": "Value", "value": data.Data.toString()});
        myfeed.params = params;
    }
    return (myfeed);
}
function DevGenericSensorT(data) {

    var ptrn = /([0-9]+(?:\.[0-9]+)?) ?(.+)/;
    var res = data.Data.match(ptrn).slice(1);
    var value = res[0];
    var suffix = res[1];
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
		room_tab.Utility=1;
	}
	
    params = [];
    params.push({"key": "Value", "value": value.toString(), "unit": suffix.toString(), "graphable": "true"});
    myfeed.params = params;
    return (myfeed);
}
function DevElectricity(data) {
    room_tab.Utility = 1;
    var ptrn1 = /(\d+) Watt/;
    var ptrn2 = /([0-9]+(?:\.[0-9]+)?) Watt/;
    var ptrn3 = /[\s,]+/;
    var ptrn4 = /([0-9]+(?:\.[0-9]+)?) kWh/;

    var myfeed;
    var params = [];
    var combo = [];
    if (data.UsageDeliv) {
        //Energy pannel
        //develectricity Usage/CounterToday
        var myfeed1 = {"id": data.idx + "_L1", "name": data.Name, "type": "DevElectricity", "room": "Utility"};

        if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
			var myfeed1 = {"id": data.idx + "_L1", "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
		} else {
			var myfeed1 = {"id": data.idx + "_L1", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
			room_tab.Utility=1;
		}
		
        var params = []
        var res = ptrn2.exec(data.Usage);
        var usage = 0;
        if (res != null) {
            usage = Math.ceil(Number(res[1]));
        }
        var res = ptrn4.exec(data.CounterToday);
        var usageToday = 0;
        if (res != null) {
            usageToday = Math.ceil(Number(res[1]));
        }
        params.push({"key": "Watts", "value": usage, "unit": "W"});
        params.push({"key": "ConsoTotal", "value": Math.ceil(usageToday), "unit": "kWh", "graphable": "true"});
        myfeed1.params = params;
        combo.push(myfeed1);
        //develectricity UsageDeliv/CounterDelivToday
        var params = [];

        if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
			var myfeed2 = {"id": data.idx + "_L2", "name": data.Name + "Deliv", "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
		} else {
			var myfeed2 = {"id": data.idx + "_L2", "name": data.Name + "Deliv", "type": "DevElectricity", "room": "Utility"};
			room_tab.Utility=1;
		}
		
        var res = ptrn2.exec(data.UsageDeliv);
        var usagedeliv = 0;
        if (res != null) {
            usagedeliv = Math.ceil(Number(res[1]));
        }
        var res = ptrn4.exec(data.CounterDelivToday);
        var usageDelivToday = 0;
        if (res != null) {
            usageDelivToday = Math.ceil(Number(res[1]));
        }
        params.push({"key": "Watts", "value": usagedeliv, "unit": "W"});
        params.push({"key": "ConsoTotal", "value": Math.ceil(usageDelivToday), "unit": "kWh", "graphable": "true"});
        myfeed2.params = params;
        combo.push(myfeed2);
        //devgeneric for Counter/CounterDeliv
        var params = [];
        var myfeed3 = {
            "id": data.idx + "_L3",
            "name": data.Name + " CounterToday",
            "type": "DevGenericSensor",
            "room": "Utility"
        };
        CounterToday = Math.ceil(data.Counter);
        params.push({"key": "Value", "value": CounterToday, "unit": "kWh", "graphable": "true"});
        myfeed3.params = params;
        combo.push(myfeed3);
        var params = [];
        var myfeed4 = {
            "id": data.idx + "_L4",
            "name": data.Name + " CounterDelivToday",
            "type": "DevGenericSensor",
            "room": "Utility"
        };
        var res = ptrn4.exec(data.CounterDelivToday);
        var CounterDelivToday = 0;
        CounterDelivToday = Math.ceil(data.CounterDeliv);
        params.push({"key": "Value", "value": CounterDelivToday, "unit": "kWh", "graphable": "false"});
        myfeed4.params = params;
        combo.push(myfeed4);
        return (combo);
    } else {

        if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
			myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
		} else {
			myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
			room_tab.Utility=1;
		}
		
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
        myfeed.params = params;
        return (myfeed);
    }
}
function DevElectricityMultiple(data) {

    var ptrn1 = /(\d+) Watt/;
    var ptrn2 = /([0-9]+(?:\.[0-9]+)?)/;
    var ptrn3 = /[\s,]+/;
    var combo = [];

    var res = data.Data.split(ptrn3);
    var usage = 0;
    if (res != null) {
        //L1
        usage = res[0];

        if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
			var myfeed1 = {"id": data.idx+ "_L1", "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
		} else {
			var myfeed1 = {"id": data.idx+ "_L1", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
			room_tab.Utility=1;
		}
		
        var params1 = [];
        params1.push({"key": "Watts", "value": usage.toString(), "unit": "W","graphable": "true"});
        myfeed1.params = params1;
        combo.push(myfeed1);
        //L2
        usage = res[2];

        if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
			var myfeed2 = {"id": data.idx+ "_L2", "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
		} else {
			var myfeed2 = {"id": data.idx+ "_L2", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
			room_tab.Utility=1;
		}
		
        var params2 = [];
        params2.push({"key": "Watts", "value": usage.toString(),"unit": "W","graphable": "true"});
        myfeed2.params = params2;
        combo.push(myfeed2);
        //L3
        usage = res[4];

        if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
			var myfeed3 = {"id": data.idx+ "_L3", "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
		} else {
			var myfeed3 = {"id": data.idx+ "_L3", "name": data.Name, "type": "DevElectricity", "room": "Utility"};
			room_tab.Utility=1;
		}
		
        var params3 = [];
        params3.push({"key": "Watts", "value": usage.toString(),"unit": "W", "graphable": "true"});
        myfeed3.params = params3;
        combo.push(myfeed3);
    }
    return (combo);
}
function DevCounterIncremental(data) {
    var ptrn1 = /(\d+) Watt/;
    var ptrn2 = /([0-9]+(?:\.[0-9]+)?) /;
    var ptrn3 = /[\s,]+/;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
		room_tab.Utility=1;
	}
	
    var params = [];
    var unit;
    switch (data.SwitchTypeVal) {
        case '0':
            //energy
            unit = 'kWh';
            break;
        case '1':
            //gas
            unit = 'm3';
            break;
        case '2':
            //water
            unit = 'm3';
            break;
        case '3':
            //counter free
            unit = data.ValueUnits.toString();
            break;
        case '4':
            //energy generated
            unit = 'kWh';
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
            params.push({"key": "ConsoTotal", "value": total.toString(), "unit": unit, "graphable": "true"});
        }
    } else {
        var res = ptrn2.exec(data.Data);
        var total = 0;
        if (res != null) {
            total = Math.ceil(Number(res[1]));
        }
        //console.log(total);
        params.push({"key": "Watts", "value": total.toString(), "unit": unit, "graphable": "true"});
    }

    myfeed.params = params;
    return (myfeed);
}
function DevGas(data) {
    var ptrn1 = /([0-9]+(?:\.[0-9]+)?) m3/;
    var ptrn2 = /([0-9]+(?:\.[0-9]+)?)/;
    var ptrn3 = /[\s,]+/;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
		room_tab.Utility=1;
	}
	
    var params = [];
    if (data.CounterToday) {
        var res = ptrn1.exec(data.CounterToday);
        var usage = 0;
        if (res != null) {
            usage = res[1]
        }

        if (!usage) {
            usage = 0;
        }
        params.push({"key": "Watts", "value": usage.toString(), "unit": "m3"});
    }
    if (data.Data) {
        var res = ptrn2.exec(data.Counter);
        var total = 0;
        if (res != null) {
            total = Math.ceil(res[1]);
        }
        params.push({"key": "ConsoTotal", "value": total.toString(), "unit": "m3"});
    }
    myfeed.params = params;
    return (myfeed);
}
function DevWater(data) {
    var ptrn1 = /(\d+) Liter/;
    var ptrn2 = /([0-9]+(?:\.[0-9]+)?) Liter/;
    var ptrn2b = /([0-9]+(?:\.[0-9]+)?) m3/;
    var ptrn3 = /[\s,]+/;
    var combo = [];
    var usage_l = 0;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevElectricity", "room": "Utility"};
		room_tab.Utility=1;
	}
	
    var params = [];
    if (data.CounterToday) {
        var res = ptrn2.exec(data.CounterToday);
        var usage = 0;
        if (res != null) {
            usage = Number(res[1]);
            usage_l = Number(res[1]);
        }
        if (!usage) {
            usage = 0;
        }
        params.push({"key": "Watts", "value": usage.toString(), "unit": "l", "graphable": "false"});
    }
    if (data.Counter) {
        var res = ptrn2b.exec(data.Counter);
        var total = 0;
        if (res != null) {
            total = Number(res[1]);
        }
        params.push({"key": "ConsoTotal", "value": total.toString(), "unit": "m3", "graphable": "true"});
    }
    //console.log(myfeed);
    myfeed.params = params;
    //combo.push(myfeed);
    /*var myfeed = {"id": data.idx+"_1", "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
     params=[];
     params.push({"key": "Value", "value": usage_l, "unit": "L", "graphable": "true"});
     myfeed.params=params;
     combo.push(myfeed);*/
    return (myfeed);
}
function DevFlow(data) {
    var ptrn1 = /(\d+) Liter/;
    var ptrn2 = /([0-9]+(?:\.[0-9]+)?) Liter/;
    var ptrn2b = /([0-9]+(?:\.[0-9]+)?) m3/;
    var ptrn3 = /[\s,]+/;
    var ptrn4 = /([0-9]+(?:\.[0-9]+)?) l\/min/;
    var combo = [];
    var usage_l = 0;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevGenericSensor", "room": "Utility"};
		room_tab.Utility=1;
	}
	
    var params = [];

    var res = ptrn4.exec(data.Data);
    //console.log(res[1]);
    var total = 0;
    if (res != null) {
        total = Number(res[1]);
    }
    params.push({"key": "Value", "value": total.toString(), "unit": "l/s", "graphable": true});
    myfeed.params = params;
    return (myfeed);
}
function DevTH(data) {

    var status = 0;
    switch (data.Type) {
        case 'Temp':

            if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTemperature", "room": domo_room_tab[data.PlanIDs[0]]};
			} else {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTemperature", "room": "Temp"};
				room_tab.Temp=1;
			}
			
            params = [];
            params.push({"key": "Value", "value": data.Temp, "unit": "°C","graphable": "true"});
            myfeed.params = params;
            return (myfeed);
        case 'Humidity':

            if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevHygrometry", "room": domo_room_tab[data.PlanIDs[0]]};
			} else {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevHygrometry", "room": "Temp"};
				room_tab.Temp=1;
			}
			
            params = [];
            params.push({"key": "Value", "value": data.Humidity, "unit": "%", "graphable": "true"});
            myfeed.params = params;
            return (myfeed);
        case 'Temp + Humidity':

            if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTempHygro", "room": domo_room_tab[data.PlanIDs[0]]};
			} else {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTempHygro", "room": "Temp"};
				room_tab.Temp=1;
			}
			
            var params = [];
            params.push({"key": "Hygro", "value": data.Humidity, "unit": "%", "graphable": "true"});
            params.push({"key": "Temp", "value": data.Temp, "unit": "°C", "graphable": "true"});
            myfeed.params = params;
            return (myfeed);
        case 'Temp + Humidity + Baro':
            var combo = [];

            if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTempHygro", "room": domo_room_tab[data.PlanIDs[0]]};
			} else {
				var myfeed = {"id": data.idx, "name": data.Name, "type": "DevTempHygro", "room": "Temp"};
				room_tab.Temp=1;
			}
			
            var params = [];
            params.push({"key": "Hygro", "value": data.Humidity, "unit": "%", "graphable": "true"});
            params.push({"key": "Temp", "value": data.Temp, "unit": "°C", "graphable": "true"});
            myfeed.params = params;
            combo.push(myfeed);

            if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
				var myfeed = {"id": data.idx+ "_1", "name": data.Name, "type": "DevPressure", "room": domo_room_tab[data.PlanIDs[0]]};
			} else {
				var myfeed = {"id": data.idx+ "_1", "name": data.Name, "type": "DevPressure", "room": "Weather"};
				room_tab.Weather=1;
			}
			
            params = [];
            params.push({"key": "Value", "value": data.Barometer, "unit": "mbar", "graphable": "true"});
            myfeed.params = params;
            combo.push(myfeed);
            return (combo);
            return (combo);
        default:
            logger.info("General: should not happen");
            break;
    }
}
function DevPressure(data) {
    room_tab.Weather = 1;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevPressure", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevPressure", "room": "Weather"};
		room_tab.Weather=1;
	}
	
    params = [];
    if (data.SubType === "Pressure") {
        if (data.Pressure < 800) {
            var mb = data.Pressure * 1000;
            params.push({"key": "Value", "value": mb, "unit": "mbar", "graphable": "true"});
        } else {
            params.push({"key": "Value", "value": data.Pressure, "unit": "bar", "graphable": "true"});
        }

    } else {
        if (data.Barometer < 800) {
            var mb = data.Barometer * 1000;
            params.push({"key": "Value", "value": mb, "unit": "mbar", "graphable": "true"});
        } else {
            params.push({"key": "Value", "value": data.Barometer, "unit": "bar", "graphable": "true"});
        }
    }

    myfeed.params = params;
    return (myfeed);
}
function DevRain(data) {
    var status = 0;

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevRain", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevRain", "room": "Weather"};
		room_tab.Weather=1;
	}
	
    var params = [];
    if (typeof data.Rain !== 'undefined' && data.Rain !== null) {
    	params.push({"key": "Accumulation", "value": data.Rain.toString(), "unit": "mm", "graphable": "true"});
    }
    if (typeof data.RainRate !== 'undefined' && data.RainRate !== null) {
    	params.push({"key": "Value", "value": data.RainRate.toString(), "unit": "mm/h", "graphable": "true"});
    }
    myfeed.params = params;
    return (myfeed);
}
function DevUV(data) {
    var status = 0;
    var myfeed = {"id": data.idx, "name": data.Name, "type": "DevUV", "room": "Weather"};

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevUV", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevUV", "room": "Weather"};
		room_tab.Weather=1;
	}
	
    params = [];
    params.push({"key": "Value", "value": data.UVI, "unit": "", "graphable": "true"});
    myfeed.params = params;
    return (myfeed);
}
function DevNoise(data) {
    var ptrn = /([0-9]+(?:\.[0-9]+)?) ?(.+)/;
    var res = data.Data.match(ptrn).slice(1);
    var value = res[0];
    var suffix = res[1];

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevNoise", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevNoise", "room": "Utility"};
		room_tab.Utility=1;
	}
	
    params = [];
    params.push({"key": "Value", "value": value, "unit": suffix.toString(), "graphable": "true"});
    myfeed.params = params;
    return (myfeed);
}
function DevLux(data) {
    var ptrn1 = /(\d+) Lux/;
    var res = ptrn1.exec(data.Data);
    var usage = 0;
    if (res != null) {
        usage = res[1]
    }
    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevLuminosity", "room": domo_room_tab[data.PlanIDs[0]], params: []};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevLuminosity", "room": "Weather", params: []};
		room_tab.Weather=1;
	}
	
    params = [];
    params.push({"key": "Value", "value": usage, "unit": "lux", "graphable": "true"});
    myfeed.params = params;
    return (myfeed);
}
function DevGases(data) {
    var ptrn1 = /(\d+) ppm/;
    var res = ptrn1.exec(data.Data);
    var usage = 0;
    if (res != null) {
        usage = Number(res[1]);
    }

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2", "room": domo_room_tab[data.PlanIDs[0]], params: []};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevCO2", "room": "Temp", params: []};
		room_tab.Temp=1;
	}
	
    params = [];
    params.push({"key": "Value", value: usage.toString(), "unit": "ppm", "graphable": "true"});
    myfeed.params = params;
    return (myfeed);
}
function DevWind(data) {

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevWind", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevWind", "room": "Weather"};
		room_tab.Weather=1;
	}
	
    var params = [];
    params.push({"key": "Speed", "value": data.Speed, "unit": "km/h", "graphable": "true"});
    if (typeof data.Direction !== 'undefined' && data.Direction !== null) {
        params.push({"key": "Direction", "value": data.Direction.toString(), "unit": "°", "graphable": "true"});
    }
    myfeed.params = params;
    return (myfeed);
}
function DevThermostat(data) {

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevThermostat", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevThermostat", "room": "Switches"};
		room_tab.Utility=1;
	}
	
    var params = [];
    params.push({"key": "cursetpoint", "value": data.SetPoint.toString()});
    params.push({"key": "curtemp", "value": data.SetPoint.toString()});
    params.push({"key": "step", "value": "0.5"});
    params.push({"key": "curmode", "value": "default"});
    params.push({"key": "availablemodes", "value": "default"});
    myfeed.params = params;
    return (myfeed);
}
function DevScene(data) {
    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": "SC" + data.idx, "name": data.Name, "type": "DevScene", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": "SC" + data.idx, "name": data.Name, "type": "DevScene", "room": "Scenes"};
		room_tab.Scenes=1;
	}
	
    params = [];
    params.push({"key": "LastRun", "value": dt});
    myfeed.params = params;
    return (myfeed);
}
function DevSceneGroup(data) {
    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": "SC" + data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": "SC" + data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": "Scenes"};
		room_tab.Scenes=1;
	}
	
    var params = [];
    params.push({"key": "LastRun", "value": dt});
    params.push({"key": "Value", "value": data.Status});
    params.push({"key": "Choices", "value": "On,Off"});
    myfeed.params = params;
    return (myfeed);
}

function DevMultiSwitchHeating(data) {
    var ptrn4 = /[\s]+|/;
    var dt = moment(data.LastUpdate, 'YYYY-MM-DD HH:mm:ss').valueOf();

    if (typeof data.PlanIDs !== 'undefined' && data.PlanIDs[0] !== null && data.PlanIDs[0] > 0) {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": domo_room_tab[data.PlanIDs[0]]};
	} else {
		var myfeed = {"id": data.idx, "name": data.Name, "type": "DevMultiSwitch", "room": "Switches"};
		room_tab.Switches=1;
	}
	
    var params = [];
    params.push({"key": "LastRun", "value": dt});
    var status;
    //console.log("L:"+data.Level);
    var mydev = {
        MaxDimLevel: null,
        Action: 10,
        graph: null,
        Selector: "Normal,Auto,AutoWithEco,Away,DayOff,Custom,HeatingOff"
    };
    //console.log(mydev);
    device_tab[data.idx] = mydev;
    var lvl = (data.Level) / 10;
    params.push({"key": "Value", "value": data.Status.toString()});
    params.push({"key": "Choices", "value": "Normal,Auto,AutoWithEco,Away,DayOff,Custom,HeatingOff"});
    myfeed.params = params;
    return (myfeed);
}

function getDeviceType(deviceId) {
    var url = getURL() +  "?type=devices&rid=" + deviceId;
    var res = requester('GET', url);
    var js = JSON.parse(res.body.toString('utf-8'));
    return (js.result[0].Type);
};

function getDeviceSubType(deviceId) {
    var url = getURL() + "?type=devices&rid=" + deviceId;
    var res = requester('GET', url);
    var js = JSON.parse(res.body.toString('utf-8'));
    return (js.result[0].SubType);
};

function DevCamera() {
    var url = getURL() + "?type=cameras&rid=";
    var res = requester('GET', url);
    var data = JSON.parse(res.body.toString('utf-8'));
    var combo = [];
    if (typeof data.result !== 'undefined' && data.result !== null) {
    for (var i = 0; i < data.result.length; i++) {
        var myfeed = {"id": "C"+i, "name": data.result[i].Name, "type": "DevCamera", "room": "Switches"};
        var params = [];
        params.push({"key": "localjpegurl", "value": data.result[i].ImageURL});
        myfeed.params = params;
        combo.push(myfeed);
    }
    }
    return (combo);
};

var auth = function (req, res, next) {
    if (!nconf.get("auth") || nconf.get("auth") === null) {
        //logger.info("No authentication provided");
        next();
        return;
    }

    var username = nconf.get("auth:username");
    var password = nconf.get("auth:password");

    var user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
        return;
    }
    if (user.name === username && user.pass === password) {
        next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
        return;
    }
}

//routes
/*app.get('/a', auth, function (req, res) {

 res.sendStatus(200,'Authenticated ');

 });*/

app.get('/', auth, function (req, res) {

    // ejs render automatically looks in the views folder
    res.render('index', {
        node_version: process.version,
        app_name: app_name,
        domo_path: getURL(),
        mdah_ver: ver,
        my_ip: my_ip,
        my_port: app.get('port')
    });
});

app.get("/system", auth, function (req, res) {
    var version = app_name;
    res.type('json');
    var latest = getLastVersion();
    res.json(
        {"id": version, "apiversion": 1});
});

app.get("/rooms", auth, function (req, res) {
    //TODO: add hidden rooms
    res.type('json');    
    var options = {
    url: getURL()+"?type=plans&order=name&used=true",
	  headers: {
	  'User-Agent': 'request'
          }
    };
	
    request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var data=JSON.parse(body);
            if (typeof  data.result !== 'undefined' &&  data.result !== null) {
                for (var i = 0; i < data.result.length; i++) {
                    //if ((typeof  data.result[i] !== 'undefined' && data.result[i] !== null) && data.result[i].Devices > 0) {
                    if (data.result[i].Devices > 0) {
                        domo_room_tab[data.result[i].idx] = data.result[i].Name;
                        room_tab[data.result[i].Name] = data.result[i].Devices;
                    }
                }
            }
		}
	})
	
    var room = [];
    for (property in room_tab) {
        room.push({id: property, name: property});
    }
    var rooms = {};
    rooms.rooms = room;
    res.json(rooms);
});

//get '/devices/:deviceId/action/:actionName/?:actionParam?'
app.get("/devices/:deviceId/action/:actionName/:actionParam?", auth, function (req, res) {
    res.type('json');
    var deviceId = req.params.deviceId;
    var actionName = req.params.actionName;
    var actionParam = req.params.actionParam;
    logger.info("GET /devices/" + deviceId + "/action/" + actionName + "/" + actionParam);
    switch (actionName) {
        case 'pulse':
            res.type('json');
            var options = {
                url: getURL() + "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&level=0&passcode="+passcode,
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
                url: getURL() + "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=" + action + "&passcode="+passcode,
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
        case 'setArmed':
            res.status(500).send({success: false, errormsg: 'not implemented'});
            break;
        case 'setAck':
            res.type('json');
            var options = {
                url: getURL() + "?type=command&param=resetsecuritystatus&idx=" + deviceId + "&switchcmd=Normal&passcode="+passcode,
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
            res.type('json');
            if (typeof device_tab[deviceId] === 'undefined' || device_tab[deviceId].Action === null) {
                res.status(500).send({success: false, errormsg: 'error'});
                break;
            }
                switch (device_tab[deviceId].Action) {
                case 1: //on/off
                    if (actionParam == 1) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&passcode="+passcode;
                    } else if (actionParam == 0) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&passcode="+passcode;
                    } else {
                        logger.error("Should not happen" + device_tab[deviceId]);
                    }
                    break;
                case 2: //blinds
                case 3: //security
                    if (actionParam == 100) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&passcode="+passcode;
                    } else if (actionParam == 0) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&passcode="+passcode;
                    } else {
                        lsetLevel = Math.ceil(actionParam * (device_tab[deviceId].MaxDimLevel) / 100);
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Set%20Level&level=" + lsetLevel + "&passcode="+passcode;
                    }
                    break;
                case 5:
                    //Blinds inverted
                    if (actionParam == 0) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&passcode="+passcode;
                    } else if (actionParam == 100) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&passcode="+passcode;
                    } else {
                        lsetLevel = Math.ceil(actionParam * (device_tab[deviceId].MaxDimLevel) / 100);
                        logger.info(actionParam + " " + lsetLevel);
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Set%20Level&level=" + lsetLevel + "&passcode="+passcode;
                    }
                    break;
                case 6:
                    //Blinds -> On for Closed, Off for Open
                    if (actionParam == 100) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Off&passcode="+passcode;
                    } else if (actionParam == 0) {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=On&passcode="+passcode;
                    } else {
                        my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Set%20Level&level=" + actionParam + "&passcode="+passcode;
                    }
                    break;
                default:
                    lsetLevel = Math.ceil(actionParam * (device_tab[deviceId].MaxDimLevel) / 100);
                    my_url = "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Set%20Level&level=" + lsetLevel + "&passcode="+passcode;
                    break;
            }
            var options = {
                url: getURL() + my_url,
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
                url: getURL() + "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Stop&level=0&passcode="+passcode,
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
                url: getURL() + "?type=setused&idx=" + deviceId + "&used=true&setpoint=" + actionParam +"&passcode="+passcode,
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
            //logger.info(console.log(sc[1]));
            var options = {
                url: getURL() + "?type=command&param=switchscene&idx=" + sc[1] + "&switchcmd=On&passcode="+passcode,
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
                url: getURL() + "?type=command&param=setcolbrightnessvalue&idx=" + deviceId + "&hex=" + actionParam.substr(2, 6).toUpperCase()+"&passcode="+passcode,
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
                    url: getURL() + "?type=command&param=switchscene&idx=" + sc[1] + "&switchcmd=" + actionParam + "&passcode="+passcode,
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
                level = device_tab[deviceId].Selector.indexOf(actionParam) * 10;
                //console.log("level="+level);
                var options = {
                    url: getURL() + "?type=command&param=switchmodal&idx=" + deviceId + "&status=" + actionParam + "&action=1&passcode="+passcode,
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
                level = device_tab[deviceId].Selector.indexOf(actionParam) * 10;
                //console.log("level="+level);
                var options = {
                    url: getURL() + "?type=command&param=switchlight&idx=" + deviceId + "&switchcmd=Set%20Level&level=" + level + "&passcode="+passcode,
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
            res.status(403).send({success: false, errormsg: 'not implemented'});
            break;
        default:
            logger.warn("unknown action: " + deviceId + " " + actionName + " " + actionParam);
            res.status(403).send({success: false, errormsg: 'not implemented'});
            break;
    }

});

app.get("/devices/:deviceId/:paramKey/histo/:startdate/:enddate", auth, function (req, res) {
    res.type('json');
    var deviceId = req.params.deviceId;
    var paramKey = req.params.paramKey;
    var startdate = req.params.startdate;
    var enddate = req.params.enddate;
    var duration = (enddate - startdate) / 1000;
    logger.info("GET /devices/" + deviceId + "/"+paramKey+"/histo/" + startdate + "/" + enddate);
    var PLine = '';
    if (deviceId.match(/_L/)) {
        var pid;
        pid = deviceId.match(/(\d+)_L(.)/);
        logger.info(pid);
        deviceId = pid[1];
        PLine = pid[2] || '';
    }
    logger.info(deviceId +"/"+PLine);
    var type = getDeviceType(deviceId).toLowerCase();
    var ptype = type;
    var curl = "&method=1";


    if ((type === "lux") || (type === "energy")) {
        type = "counter";
        curl = "&method=1";
    }
    if ((type === "air quality")||(type === "p1 smart meter")||(paramKey === "Watts")) {
        type = "counter";
    }
    if ((ptype === "general")) {
        var st=getDeviceSubType(deviceId);
        if ((st==='Current')||(st==='kWh')||(st==='Solar Radiation')||(st==='Visibility')||(st==='Pressure')) {
            type = "counter";
        } else {
            type = "Percentage";
        }
    }
    if ((paramKey === "temp")||(type === "temp + humidity")||(paramKey === "hygro")||(type === "humidity")) {
        type = "temp";
    }

    logger.info(deviceId + " "+PLine + " "+type + " " +paramKey);
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
        url: getURL() + "?type=graph&sensor=" + type + curl + "&idx=" + deviceId + "&range=" + range,
        headers: {
            'User-Agent': 'request'
        }
    };
    logger.info(options.url);
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var result = [];
            var params = [];
            var lastEu;

            if (!(data.result||null&&data.result.length||null)) {
                var feeds = {"date": startdate, "value": 0};
                params.push(feeds);
                var rest = {};
                rest.values = params;
                res.json(rest);
            } else {
                //logger.info(data.result);
                for (var i = 0; i < data.result.length; i++) {
                    var key;
                    for (var i in data.result[i]) {
                        if (!(i === 'd')) {
                            if ((i.match(/_max/)) || (i.match(/_min/))) {
                                var ptrn = /^([^_]*)_/;
                                key = i.match(ptrn).slice(1);
                            } else {
                                key = i;
                            }
                        }
                    }
                }
                if (key === 'tm') {key='te';}
                if (paramKey === 'temp') {
                    key = 'te';
                    for (var i = 0; i < data.result.length; i++) {
                        var value = parseFloat(data.result[i][key]);
                        var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                        var feeds = {"date": dt, "value": value};
                        params.push(feeds);
                    }
                } else if (paramKey === 'hygro') {
                    key = 'hu';
                    for (var i = 0; i < data.result.length; i++) {
                        var value = data.result[i][key];
                        var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                        var feeds = {"date": dt, "value": value};
                        params.push(feeds);
                    }
                } else if (paramKey === 'ConsoTotal') {
                   if (ptype==='p1 smart meter') {
                       var key2;
                       if (PLine==1) {
                           key = 'r1';
                           key2= 'r2';
                       } else if (PLine ==2) {
                           key = 'v';
                           key2 = 'v2';
                       }
                       logger.info("P1 "+PLine+" "+key+" "+key2);
                        for (var i = 0; i < data.result.length; i++) {
                            var value = (parseFloat(data.result[i][key]) + parseFloat(data.result[i][key2]));
                            var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                            var feeds = {"date": dt, "value": value};
                            params.push(feeds);
			            }
                   } else {
                        key = 'v';
                        for (var i = 0; i < data.result.length; i++) {
                            var value = data.result[i][key];
                            var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                            var feeds = {"date": dt, "value": value};
                            params.push(feeds);
                        }
                    }
		        } else if (paramKey === 'Watts') {
                        key = 'v'+PLine;
                        var key2 ='v'+(parseInt(PLine)+3);
                        for (var i = 0; i < data.result.length; i++) {
                            if ((range === 'month') || (range === 'year')) {
                                var value = (parseFloat(data.result[i][key]) + parseFloat(data.result[i][key2])) / 2;
                                var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                                var feeds = {"date": dt, "value": value};
                                params.push(feeds);
                            } else {
                                var value = data.result[i][key];
                                var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                                var feeds = {"date": dt, "value": value};
                                params.push(feeds);
                            }
                        }
                } else if (paramKey === 'speed') {
                    key = 'sp';
                    for (var i = 0; i < data.result.length; i++) {
                        var value = data.result[i][key];
                        var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                        var feeds = {"date": dt, "value": value};
                        params.push(feeds);
                    }
                } else {
                    var kmax;
                    var kmin;
                    if (key === 'te') {
                        kmax = 'te';
                        kmin = 'te';
                    } else if (key === 'hu') {
                        kmax = 'hu';
                        kmin = 'hu';
                    } else if (key === 'mm') {
                        kmax = 'mm';
                        kmin = 'mm';
                    } else if (key === 'uvi') {
                        kmax = 'uvi';
                        kmin = 'uvi';
                    } else {
                        kmax = key + "_max";
                        kmin = key + "_min";
                    }
                    //logger.info("KK"+kmin+" "+kmax);
                    for (var i = 0; i < data.result.length; i++) {
                        if ((range === 'month') || (range === 'year')) {
                            var value = (parseFloat(data.result[i][kmax]) + parseFloat(data.result[i][kmin])) / 2;
                            var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                            var feeds = {"date": dt, "value": value};
                            params.push(feeds);
                        } else {
                            var value = data.result[i][key];
                            var dt = moment(data.result[i].d, 'YYYY-MM-DD HH:mm:ss').valueOf();
                            var feeds = {"date": dt, "value": value};
                            params.push(feeds);
                        }
                    }
                }


            var rest = {};
            rest.values = params;
            res.json(rest);
            }
        } else {
            //TODO
            res.status(403).send({success: false, errormsg: 'not implemented'});
        }
    });
})

app.get("/devices", auth, function (req, res) {
    res.type('json');
	
	var options = {
		url: getURL() + "?type=devices&filter=utility&order=Name",
		headers: {
			'User-Agent': 'request'
		}
    };
    logger.info(options);
    var domo_energy_devices = {};

    request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var data=JSON.parse(body);
			if (typeof  data.result !== 'undefined' &&  data.result !== null) {
				for(var i = 0; i < data.result.length; i++) {
					if(data.result[i].SubType == "Electric") {
						domo_energy_devices[data.result[i].ID] = data.result[i].Data.replace(" Watt","");
					}
				}
				logger.info("Domoticz server - energy devices: " + JSON.stringify(domo_energy_devices));
			}
		}
	})

    var options = {
        url: getURL() + "?type=devices&filter=all&used=true&order=Name",
        headers: {
            'User-Agent': 'request'
        }
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var result = [];
            //my ID string
            var myfeed = {"id": "S0", "name": "MyDomoAtHome", "type": "DevGenericSensor"};
            var params = [];
            params.push({"key": "Value", "value": ver, "unit": "", "graphable": "false"});
            myfeed.params = params;
            result.push(myfeed);
            var rv = getLastVersion();
            //logger.info(ver+" "+rv);

            if ((typeof rv !== 'undefined' && rv !== null) &&(versionCompare(ver, rv.substring(1)) < 0)) {
                var myfeed = {"id": "S1", "name": "New version found", "type": "DevGenericSensor"};
                var params = [];
                params.push({"key": "Value", "value": last_version, "unit": "", "graphable": "false"});
                myfeed.params = params;
                result.push(myfeed);
            }
            for (var i = 0; i < data.result.length; i++) {
                //console.log(data.result[i].Type);
                if (typeof data.result[i].ID !== 'undefined' && data.result[i].ID !== null) {

                    if (domo_energy_devices[data.result[i].ID.substr(1 - data.result[i].ID.length)]) {
                        data.result[i].Energy = domo_energy_devices[data.result[i].ID.substr(1 - data.result[i].ID.length)];
                    }
                }
				
                switch (data.result[i].Type) {
                    case (data.result[i].Type.match(/Light/) || {}).input:
                        switch (data.result[i].SwitchType) {
                            case 'On/Off':
                            case 'Dusk Sensor':
                                if (data.result[i].SubType == 'RGB') {
                                    result.push(DevRGBLight(data.result[i]));
                                } else if (data.result[i].SubType == 'RGBW') {
                                    result.push(DevRGBLight(data.result[i]));
                                } else {
                                    result.push(DevSwitch(data.result[i]));
                                }
                                break;
                            case 'Push On Button':
                            case 'Push Off Button':
                                result.push(DevPush(data.result[i]));
                                break;
                            case 'Switch':
                                result.push(DevSwitch(data.result[i]));
                                break;
                            case 'Dimmer':
                                if (data.result[i].SubType == 'RGB') {
                                    //console.log("OK"+data.result[i].SubType);
                                    result.push(DevRGBLight(data.result[i]));
                                } else if (data.result[i].SubType == 'RGBW') {
                                    //console.log("OK"+data.result[i].SubType);
                                    result.push(DevRGBLight(data.result[i]));
                                } else {
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
                            case 'RollerTrol, Hasta new':
                                result.push(DevShutter(data.result[i]));
                                break;
                            case 'Motion Sensor':
                                result.push(DevMotion(data.result[i]));
                                break;
                            case 'Door Lock':
                            case 'Contact':
                                result.push(DevDoor(data.result[i]));
                                break;
                            case 'Smoke Detector':
                                result.push(DevSmoke(data.result[i]));
                                break;
                            case (data.result[i].SwitchType.match(/Siren/) || {}).input:
                                result.push(DevSwitch(data.result[i]));
                                break;
                            case 'Selector':
                                result.push(DevMultiSwitch(data.result[i]));
                                break;
                            case 'Media Player':
                                //TODO
                                break;
                            default:
                                logger.warn("UNK Sw " + data.result[i].Name+"SwitchType:"+data.result[i].SwitchType);
                                break;
                        }
                        break;
                    case 'Chime':
                        result.push(DevDimmer(data.result[i]));
                        break;
                    case 'Blinds':
                    case 'RFY':
                        switch (data.result[i].SwitchType) {
                            case 'Blinds Inverted':
                            case 'Blinds Percentage Inverted':
                                result.push(DevShutterInverted(data.result[i]));
                                break;
                            case 'Blinds Percentage':
                            case 'Blinds':
                            case 'RFY':
                            case 'Venetian Blinds EU':
                            case 'Venetian Blinds US':
                            case 'RollerTrol, Hasta new':
                                result.push(DevShutter(data.result[i]));
                                break;
                            default:
                                logger.warn("UNK Blind " + data.result[i].Name+"SwitchType:"+data.result[i].SwitchType);
                                break;
                        }
                        break;
                    case 'Security':
                        switch (data.result[i].SwitchType) {
                            case 'Smoke Detector':
                                result.push(DevSmoke(data.result[i]));
                                break;
                            case 'Security':
                                result.push(DevGenericSensor(data.result[i]));
                                break;
                            default:
                                logger.warn("UNK Sec " + data.result[i].Name+"SwitchType:"+data.result[i].SwitchType);
                                break;
                        }
                        break;
                    case 'P1 Smart Meter':
                        switch (data.result[i].SubType) {
                            case 'Energy':
                                var rt = DevElectricity(data.result[i]);
                                for (var ii = 0; ii < rt.length; ii++) {
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
                        switch (data.result[i].SubType) {
                            case 'YouLess counter':
                                result.push(DevElectricity(data.result[i]));
                                break;
                            default:
                                logger.warn("UNK Sec " + data.result[i].Name+"SwitchType:"+data.result[i].SwitchType);
                                break;
                        }
                        break;
                    case 'Energy':
                    case 'Power':
                    case 'Usage':
                        result.push(DevElectricity(data.result[i]));
                        break;
                    case 'Current':
                        //TODO
                        result.push(DevElectricity(data.result[i]));
                        break;
                    case 'Current/Energy':
                        var rt = DevElectricityMultiple(data.result[i]);
                        for (var ii = 0; ii < rt.length; ii++) {
                            result.push(rt[ii]);
                        }
                        break;
                    case 'Temp':
                    case 'Temp + Humidity':
                    case 'Humidity':
                        result.push(DevTH(data.result[i]));
                        break;
                    case 'Temp + Humidity + Baro':
                        var rt = DevTH(data.result[i]);
                        for (var ii = 0; ii < rt.length; ii++) {
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
                        switch (data.result[i].SwitchTypeVal) {
                            case 1:
                                result.push(DevGas(data.result[i]));
                                break;
                            case 2:
                                /*var rt=DevWater(data.result[i]);
                                 for(var ii = 0; ii < rt.length; ii++) {
                                 result.push(rt[ii]);
                                 }*/
                                result.push(DevWater(data.result[i]));
                                break;
                            case 3:
                                result.push(DevCounterIncremental(data.result[i]));
                                break;
                            default:
                                logger.warn("RFX Unknown " + data.result[i].Name + " " + data.result[i].SwitchTypeVal+" "+data.result[i].SubType);
                        }
                        break;
                    case 'General':
                        switch (data.result[i].SubType) {
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
                                logger.warn("Unknown general " + data.result[i].Name + " " + data.result[i].SwitchTypeVal + " "+ data.result[i].SubType);
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
                                result.push(DevGenericSensorT(data.result[i]));
                                break;
                            default:
                                logger.warn("General Unknown " + data.result[i].Name + " " + data.result[i].SubType+" "+data.result[i].SwitchTypeVal);
                                break;
                        }
                        break;
                    case 'Heating':
                        switch (data.result[i].SubType) {
                            case 'Evohome':
                                result.push(DevMultiSwitchHeating(data.result[i]));
                                break;
                            /*case 'Zone':
                             break;
                             case 'Hot Water':
                             break;*/
                            default:
                                logger.warn("General Unknown " + data.result[i].Name + " " + data.result[i].SubType);
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
                        logger.warn("Unknown SwitchType " + data.result[i].Type+ " "+data.result[i].SwitchTypeVal);
                        break;
                }
            }

            var rt = DevCamera();
            for (var ii = 0; ii < rt.length; ii++) {
                result.push(rt[ii]);
            }
            var rest = {};
            rest.devices = result;
            res.json(rest);
        } else {
            var result = [];
            result.push(DevGenericSensor({
                idx: 'S00',
                Name: "Unable to connect to Domoticz",
                "Data": getURL()
            }))
            result.push(DevGenericSensor({
                idx: 'S01',
                Name: "Please add this gateway in Setup/settings/Local Networks",
                "Data": ""
            }))
            var rest = {};
            rest.devices = result;
            res.json(rest);

        }
    })
});

// error handling middleware should be loaded after the loading the routes
// all environments


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not found');
    err.status = 404;
    next(err);
});

// error handlers
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: err
    });
});


logger.info("Domoticz server: " + getURL());
logger.info("Node version: " + process.versions.node);
logger.info("MDAH version: " + app_name + " " + ver);
logger.info("OS version: " + os.type() + " " + os.platform() + " " + os.release());
if (process.env.CONTAINER) {
    logger.info("Microservice: yes");
}
var interfaces = os.networkInterfaces();
var addresses = [];
var my_ip;
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
            my_ip = address.address;
        }
    }
}

if (versionCompare(process.versions.node, '1.0.0') < 0) {
    logger.info("Hostname: " + os.hostname() + " " + my_ip);
} else {
    logger.info("Hostname: " + os.hostname() + " " + my_ip + " in " + os.homedir());
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
var gracefulShutdown = function () {
    logger.warn("Received kill signal, shutting down gracefully.");
    server.close(function () {
        logger.warn("Closed out remaining connections.");
        process.exit()
    });
    // if after
    setTimeout(function () {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit()
    }, 2 * 1000);
}
//start server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
    logger.info('MDAH port: ' + app.get('port'));
});

server.on('error', function (e) {
    if (e.code == 'EADDRINUSE') {
        logger.info('Address in use, retrying...');

        setTimeout(function () {
            server.close();
            server.listen(port);
        }, 4000);
    }
});
module.exports = app;
