# MySensors Gateway Plugin
# 
# Created by epierre <epierre@e-nef.com>
#
# http://www.mysensors.org
# https://github.com/empierre/arduino/
#
# See github for contributors
#	
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# version 2 as published by the Free Software Foundation.
package MySensorsMSG;
use utf8;
use Time::Piece;
use Device::SerialPort;
use File::Slurp;
use IO::Handle;
use feature     qw< unicode_strings >;
use constant {
	VERSION 	=> '0.2',
	PLUGIN_NAME 	=> "MySensors Gateway Plugin",
	PLUGIN_VERSION 	=> "1.4b1",
	MAX_RADIO_ID	=>255,
	NODE_CHILD_ID	=>"255",
	BAUD_RATE 	=> "115200",
	ARDUINO_SID 	=> "urn:upnp-arduino-cc:serviceId:arduino1",
	VARIABLE_CONTAINER_SID => "urn:upnp-org:serviceId:VContainer1"
};
my $inclusionResult = {};
my $includeCount = 0;
#Variables in msgw can be overridded in config file
my $InclusionMode = 0;
my $unit = "M";
	
#defines
my %msgType = (
        'PRESENTATION' => "0",
        'SET_VARIABLE' => "1",
        'REQ_VARIABLE' => "2",
	'ACK_VARIABLE' => "3",
        'INTERNAL'     => "4",
	'STREAMING'    => "5" );

my %tDeviceLookupNumType;
my %tDeviceTypes = (
	'DOOR' 	=> [0, "urn:schemas-micasaverde-com:device:DoorSensor:1", "D_DoorSensor1.xml", "Door "],
	'MOTION' 	=> [1, "urn:schemas-micasaverde-com:device:MotionSensor:1", "D_MotionSensor1.xml", "Motion "],
	SMOKE 	=> [2, "urn:schemas-micasaverde-com:device:SmokeSensor:1", "D_SmokeSensor1.xml", "Smoke "],
	LIGHT 	=> [3, "urn:schemas-upnp-org:device:BinaryLight:1", "D_BinaryLight1.xml", "Light "],
	DIMMER 	=> [4, "urn:schemas-upnp-org:device:DimmableLight:1", "D_DimmableLight1.xml", "Dim Light "],
	COVER 	=> [5, "urn:schemas-micasaverde-com:device:WindowCovering:1", "D_WindowCovering1.xml", "Win Covering "] ,
	TEMP 	=> [6, "urn:schemas-micasaverde-com:device:TemperatureSensor:1", "D_TemperatureSensor1.xml", "Temp "],
	HUM 	=> [7, "urn:schemas-micasaverde-com:device:HumiditySensor:1", "D_HumiditySensor1.xml", "Humidity "],
	BARO 	=> [8, "urn:schemas-micasaverde-com:device:BarometerSensor:1", "D_BarometerSensor1.xml", "Baro "],
	WIND 	=> [9, "urn:schemas-micasaverde-com:device:WindSensor:1", "D_WindSensor1.xml", "Wind "],
	RAIN 	=> [10, "urn:schemas-micasaverde-com:device:RainSensor:1", "D_RainSensor1.xml", "Rain "],
	UV 	=> [11, "urn:schemas-micasaverde-com:device:UvSensor:1", "D_UvSensor1.xml", "UV "],
	WEIGHT 	=> [12, "urn:schemas-micasaverde-com:device:ScaleSensor:1", "D_ScaleSensor1.xml", "Weight "],
	POWER 	=> [13, "urn:schemas-micasaverde-com:device:PowerMeter:1", "D_PowerMeter1.xml", "Power "],
	HEATER 	=> [14, "urn:schemas-upnp-org:device:Heater:1", "D_Heater1.xml", "Heater "],
	DISTANCE => [15, "urn:schemas-upnp-org:device:Distance:1", "D_DistanceSensor1.xml", "Distance "],
	LIGHT_LEVEL => [16, "urn:schemas-micasaverde-com:device:LightSensor:1", "D_LightSensor1.xml", "Light "],
	ARDUINO_NODE => [17, "urn:schemas-arduino-cc:device:arduinonode:1", "D_ArduinoNode1.xml", "Node "],
	ARDUINO_RELAY => [18, "urn:schemas-arduino-cc:device:arduinorelay:1", "D_ArduinoRelay1.xml", "Relay "],
	LOCK 	=> [19, "urn:micasaverde-com:serviceId:DoorLock1", "D_DoorLock1.xml", "Lock "],
	IR 	=> [20, "urn:schemas-arduino-cc:device:ArduinoIr:1", "D_ArduinoIr1.xml", "IR "],
	WATER 	=> [21, "urn:schemas-micasaverde-com:device:WaterMeter:1", "D_WaterMeter1.xml", "Water "]
);

my %tVarLookupNumType;
my %tVarTypes =(
	TEMP 	=> [0, "urn:upnp-org:serviceId:TemperatureSensor1", "CurrentTemperature", ""],
	HUM 	=> [1, "urn:micasaverde-com:serviceId:HumiditySensor1", "CurrentLevel", ""],
	LIGHT 	=> [2, "urn:upnp-org:serviceId:SwitchPower1", "Status", "0"] ,
	DIMMER 	=> [3, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus", ""],
	PRESSURE => [4, "urn:upnp-org:serviceId:BarometerSensor1", "CurrentPressure", ""],
	FORECAST => [5, "urn:upnp-org:serviceId:BarometerSensor1", "Forecast", ""],
	RAIN 	=> [6, "urn:upnp-org:serviceId:RainSensor1", "CurrentTRain", ""],
	RAINRATE => [7, "urn:upnp-org:serviceId:RainSensor1", "CurrentRain", ""],
	WIND 	=> [8, "urn:upnp-org:serviceId:WindSensor1", "AvgSpeed", ""],
	GUST 	=> [9, "urn:upnp-org:serviceId:WindSensor1", "GustSpeed", ""],
	DIRECTION => [10, "urn:upnp-org:serviceId:WindSensor1", "Direction", ""],
	UV 	=> [11, "urn:upnp-org:serviceId:UvSensor1", "CurrentLevel", ""],
	WEIGHT 	=> [12, "urn:micasaverde-com:serviceId:ScaleSensor1", "Weight", ""],
	DISTANCE => [13, "urn:micasaverde-com:serviceId:DistanceSensor1", "CurrentDistance", ""],
	IMPEDANCE => [14, "urn:micasaverde-com:serviceId:ScaleSensor1", "Impedance", ""],
	ARMED 	=> [15, "urn:micasaverde-com:serviceId:SecuritySensor1", "Armed", ""],
	TRIPPED => [16, "urn:micasaverde-com:serviceId:SecuritySensor1", "Tripped", "0"] ,
	WATT 	=> [17, "urn:micasaverde-com:serviceId:EnergyMetering1", "Watts", ""],
	KWH 	=> [18, "urn:micasaverde-com:serviceId:EnergyMetering1", "KWH", "0"],
	SCENE_ON => [19, "urn:micasaverde-com:serviceId:SceneController1", "sl_SceneActivated", ""],
	SCENE_OFF => [20, "urn:micasaverde-com:serviceId:SceneController1", "sl_SceneDeactivated", ""],
	HEATER 	=> [21, "urn:upnp-org:serviceId:HVAC_UserOperatingMode1", "ModeStatus", ""],
	HEATER_SW => [22, "urn:upnp-org:serviceId:SwitchPower1", "Status", ""],
	LIGHT_LEVEL => [23, "urn:micasaverde-com:serviceId:LightSensor1", "CurrentLevel", ""],
	VAR_1 	=> [24, "urn:upnp-org:serviceId:VContainer1", "Variable1", ""],
	VAR_2 	=> [25, "urn:upnp-org:serviceId:VContainer1", "Variable2", ""],
	VAR_3 	=> [26, "urn:upnp-org:serviceId:VContainer1", "Variable3", ""],
	VAR_4 	=> [27, "urn:upnp-org:serviceId:VContainer1", "Variable4", ""],
	VAR_5 	=> [28, "urn:upnp-org:serviceId:VContainer1", "Variable5", ""],
	UP 	=> [29,'','', ""],
	DOWN 	=> [30,'','', ""],
	STOP 	=> [31,'','', ""],
	IR_SEND => [32,'','', ""],
	IR_RECEIVE => [33, "urn:upnp-org:serviceId:ArduinoIr1", "IrCode", ""],
	FLOW 	=> [34, "urn:micasaverde-com:serviceId:WaterMetering1", "Flow", ""],
	VOLUME 	=> [35, "urn:micasaverde-com:serviceId:WaterMetering1", "Volume", "0"],
	LOCK 	=> [36, "urn:micasaverde-com:serviceId:DoorLock1", "Status", ""]
);
my %tInternalLookupNumType;
my %tInternalTypes = (
	BATTERY_LEVEL => [0, "urn:micasaverde-com:serviceId:HaDevice1", "BatteryLevel", ""],
	BATTERY_DATE  => [1, "urn:micasaverde-com:serviceId:HaDevice1", "BatteryDate", ""],
	'LAST_TRIP'     => [2, "urn:micasaverde-com:serviceId:SecuritySensor1", "LastTrip", ""],
	TIME 	      => [3,'','',''],
	VERSION       => [4, "urn:upnp-arduino-cc:serviceId:arduinonode1", "ArduinoLibVersion", ""],
	REQUEST_ID    => [5,'','',''],
	INCLUSION_MODE =>[6, "urn:upnp-arduino-cc:serviceId:arduino1", "InclusionMode", "0"],
	RELAY_NODE    => [7, "urn:upnp-arduino-cc:serviceId:arduinonode1", "RelayNode", ""],
	LAST_UPDATE   => [8, "urn:micasaverde-com:serviceId:HaDevice1", "LastUpdate", ""],
	PING 	      => [9,'','',''],
	PING_ACK      => [10,'','',''],
	LOG_MESSAGE   => [11,'','',''],
	CHILDREN      => [12, "urn:upnp-arduino-cc:serviceId:arduinonode1", "Children", "0"],
	UNIT          =>	[13, "urn:upnp-arduino-cc:serviceId:arduino1", "Unit", "M"], # M = Metric / I = Imperial
	SKETCH_NAME   => [14, "urn:upnp-arduino-cc:serviceId:arduinonode1", "SketchName", ""],
	SKETCH_VERSION => [15, "urn:upnp-arduino-cc:serviceId:arduinonode1", "SketchVersion", ""]
);

#lookup tables
my %childIdLookupTable;
my %availableIds;for (my $i=0;$i<254;$i++) {$availableIds[$i]=1;};

while (my ($k, $v) = each %tVarTypes) {
	$tVarLookupNumType[$v->[0]] = $k;
}
while (my ($k, $v) = each %tDeviceTypes) {
	$tVarLookupNumType[$v->[0]] = $k;
}
while (my ($k, $v) = each %tInternalTypes) {
	$tInternalLookupNumType[$v->[0]] = $k;
}

sub setVariable {
	my ($self, $incomingData, $childId, $nodeId)=@_;
	if ($childId){ 
		# Set variable reported from a child sensor.
		my $index = $incomingData->[3];
		my $varType = $tVarLookupNumType[$index];
		my $var = $tVarTypes[$varType];
		my $value = $incomingData->[4];
		if ($var->[1]) {
			&log("setVariable: RadioId: "+$incomingData->[0]+" Sensor: "+$incomingData->[1]+" ChildId: "+$childId+" Type: " +$tVarLookupNumType[$index]+" reporting value: "+ $value);
			&setVariableIfChanged($var->[1], $var->[2], $value, $childId);
			# Handle special variables battery level and tripped which also
			# should update other variables to os.time(). This part should be removed...
			if (($varType eq "TRIPPED") and ($value eq "1")) {
				my $variable = $tInternalTypes{'LAST_TRIP'};
				&setVariableIfChanged($variable->[1], $variable->[2], time(), $childId);
			}
		}
	}
}

1;
