package Domo;
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# version 2 as published by the Free Software Foundation.
# Author: epierre <epierre@e-nef.com>
use Dancer ':syntax';
use File::Slurp;
use LWP::UserAgent;
use Crypt::SSLeay;
use utf8;
use Time::Piece;
use feature     qw< unicode_strings >;
use POSIX qw(ceil);
#use JSON;

our $VERSION = '0.8';
set warnings => 0;
my %device_tab;

set serializer => 'JSON'; 
prefix undef;

get '/' => sub {
    template 'index';
};

get '/rooms' => sub {
       #Room list
  return {"rooms" => [ 
		{ "id"=> "noroom", "name"=> "noroom" },
		{ "id"=> "Switches", "name"=> "Switches" },
		{ "id"=> "Scenes", "name"=> "Scenes" },
		{ "id"=> "Temp", "name"=> "Weather" },
		{ "id"=> "Utility", "name"=> "Utility" },
			]};
};

get '/system' => sub {
 return {"id"=> "MyDomoAtHome","apiversion"=> 1};
};


get '/devices/:deviceId/action/:actionName/?:actionParam?' => sub {
my $deviceId = params->{deviceId};
my $actionName = params->{actionName};
my $actionParam = params->{actionParam}||"";

if ($actionName eq 'setStatus') {
debug("actionParam=".$actionParam."\n");
        #setStatus	0/1
	my $action;
	if ($actionParam) {
		$action="On";
	} else {
		$action="Off";
	}
	my $url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=$action&level=0&passcode=";
debug($url);
	my $browser = LWP::UserAgent->new;
	my $response = $browser->get($url);
	if ($response->is_success){ 
		return { success => true};
	} else {
		status 'error';
		return { success => false, errormsg => $response->status_line};
	}
} elsif ($actionName eq 'setArmed') {
	#setArmed	0/1
	status 'error';
	return { success => false, errormsg => "not implemented"};
} elsif ($actionName eq 'setAck') {
	#setAck	
		my $url=config->{domo_path}."/json.htm?type=command&param=resetsecuritystatus&idx=$deviceId&switchcmd=Normal";
	debug($url);
		my $browser = LWP::UserAgent->new;
		my $response = $browser->get($url);
		if ($response->is_success){ 
			return { success => true};
		} else {
			status 'error';
			return { success => false, errormsg => $response->status_line};
		}
} elsif ($actionName eq 'setLevel') {
	#setLevel	0-100 => 0-16
	#/json.htm?type=command&param=switchlight&idx=&switchcmd=Set%20Level&level=6
	my $url;
	if (($device_tab{$deviceId}->{"Action"}==2)or($device_tab{$deviceId}->{"Action"}==3)) {
		if ($actionParam eq "100") {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=On&level=$actionParam&passcode=";
		} else {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Off&level=$actionParam&passcode=";
		}
	} elsif (($device_tab{$deviceId}->{"Action"}==5)) {
		#Blinds inverted
		if ($actionParam eq "100") {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=On&level=0&passcode=";
		} else {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Off&level=$actionParam&passcode=";
		}
	} elsif (($device_tab{$deviceId}->{"Action"}==6)) {
		#Blinds -> On for Closed, Off for Open 
		if ($actionParam eq "100") {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Off&level=0&passcode=";
		} else {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=On&level=0&passcode=";
		}
	} else {
		if ($actionParam eq "1") {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Off&level=$actionParam&passcode=";
		} elsif ($actionParam eq "0") {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=On&level=$actionParam&passcode=";

		} else {
			my $valeur=ceil($actionParam*0.16);
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Set%20Level&level=$valeur&passcode=";
		}
	}

	debug($url);
		my $browser = LWP::UserAgent->new;
		my $response = $browser->get($url);
		if ($response->is_success){ 
			return { success => true};
		} else {
			status 'error';
			return { success => false, errormsg => $response->status_line};
		}
	} elsif ($actionName eq 'stopShutter') {
		#stopShutter (Venetian store)
		my $url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Stop&level=0&passcode=";
debug($url);
		my $browser = LWP::UserAgent->new;
		my $response = $browser->get($url);
		if ($response->is_success){ 
			return { success => true};
		} else {
			status 'error';
			return { success => false, errormsg => $response->status_line};
		}
		return { success => true};
		} elsif ($actionName eq 'pulseShutter') {
		#pulseShutter	up/down
		status 'error';
		return { success => false, errormsg => "not implemented"};
	} elsif ($actionName eq 'launchScene') {
	#launchScene
	#/json.htm?type=command&param=switchscene&idx=&switchcmd=
	my $url=config->{domo_path}."/json.htm?type=command&param=switchscene&idx=$deviceId&switchcmd=On&passcode=";
debug($url);
	my $browser = LWP::UserAgent->new;
	my $response = $browser->get($url);
	if ($response->is_success){ 
		return { success => true};
	} else {
		status 'error';
		return { success => false, errormsg => $response->status_line};
	}
	return { success => true};
} elsif ($actionName eq 'setChoice') {
	#setChoice string
	status 'error';
	return { success => false, errormsg => "not implemented"};
    } else {
        status 'not_found';
        return "What?";
   }
};

get '/devices' => sub {
	my $feed={ "devices" => []};
	my $system_url = config->{domo_path}."/json.htm?type=devices&filter=all&used=true&order=Name";
	my $decoded;
	my @results;
debug($system_url);
	my $ua = LWP::UserAgent->new();
	$ua->agent("MyDomoREST/$VERSION");
	my $json = $ua->get( $system_url );
	if ($json->is_success) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
		if ($decoded->{'result'}) {
			@results = @{ $decoded->{'result'} };
			foreach my $f ( @results ) {
					my $dt = Time::Piece->strptime($f->{"LastUpdate"},"%Y-%m-%d %H:%M:%S");
					my $name=$f->{"Name"};
					$name=~s/\s/_/;
					$name=~s/\s/_/;
					$name=~s/\//_/;
					$name=~s/%/P/;
				 if ($f->{"SwitchType"}) {			
					#print $f->{"idx"} . " " . $f->{"Name"} . " " . $f->{"Status"} . $f->{"LastUpdate"}."\n";
					#$name.="_E";
					my $bl=$f->{"Status"};my $rbl;
				if ($bl eq "On") { $rbl=1;$device_tab{$f->{"idx"}}->{"Action"}=1;}
				elsif ($bl eq "Off") { $rbl=0;$device_tab{$f->{"idx"}}->{"Action"}=1;}
				elsif ($bl eq "Open") { $rbl=1;$device_tab{$f->{"idx"}}->{"Action"}=2;}
				elsif ($bl eq "Closed") { $rbl=0;$device_tab{$f->{"idx"}}->{"Action"}=2;}
				elsif ($bl eq "Panic") { $rbl=1;$device_tab{$f->{"idx"}}->{"Action"}=3;}
				elsif ($bl eq "Normal") { $rbl=0;$device_tab{$f->{"idx"}}->{"Action"}=3;}
				else { $rbl=$bl;}
					if (($f->{"SwitchType"} eq "On/Off")or($f->{"SwitchType"} eq "Push On Button")or($f->{"SwitchType"} eq "Push Off Button")or($f->{"SwitchType"} eq "Contact")or($f->{"SwitchType"} eq "Dusk Sensor")) {
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevSwitch", "room" => "Switches", params =>[]};
						push (@{$feeds->{'params'}}, {"key" => "Status", "value" =>"$rbl"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif (($f->{"SwitchType"} eq "Dimmer")||($f->{"SwitchType"} eq "Doorbell")) {
						#DevDimmer	Dimmable light
						#Status	Current status : 1 = On / 0 = Off	N/A
						#Level	Current dim level (0-100)	%
						#"idx" : "3", "Name" : "Alerte",  "Level" : 0,  "SwitchType" : "Dimmer",  "Status" : "Off","LastUpdate" : "2014-03-18 22:17:18"
						if ($rbl=~/Set Level/) {$rbl=1;}
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevDimmer", "room" => "Switches", params =>[]};

						push (@{$feeds->{'params'}}, {"key" => "Status", "value" =>"$rbl"} );
						push (@{$feeds->{'params'}}, {"key" => "Level", "value" => $f->{"Level"} } );

						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"SwitchType"} eq "Blinds Inverted") {
						#DevShutter
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevShutter", "room" => "Switches", params =>[]};
						my $v;
						if ($f->{"Status"} eq "Open") {$v=100;} else {$v=0;};
						my $bl=$f->{"Status"};my $rbl;
						if ($bl eq "Open") { $rbl=1;$device_tab{$f->{"idx"}}->{"Action"}=5;}
						elsif ($bl eq "Closed") { $rbl=0;$device_tab{$f->{"idx"}}->{"Action"}=5;};
						push (@{$feeds->{'params'}}, {"key" => "stopable", "value" =>"0"} );
						push (@{$feeds->{'params'}}, {"key" => "pulseable", "value" =>"0"} );
						push (@{$feeds->{'params'}}, {"key" => "Level", "value" => "$v" } );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"SwitchType"} eq "Blinds Percentage") {
						#DevShutter
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevShutter", "room" => "Switches", params =>[]};
						my $v;
						if ($f->{"Status"} eq "Open") {$v=100;} else {$v=$f->{"Level"}};
						my $bl=$f->{"Status"};my $rbl;
						if ($bl eq "Open") { $rbl=1;$device_tab{$f->{"idx"}}->{"Action"}=6;}
						elsif ($bl eq "Closed") { $rbl=0;$device_tab{$f->{"idx"}}->{"Action"}=6;};

						push (@{$feeds->{'params'}}, {"key" => "stopable", "value" =>"0"} );
						push (@{$feeds->{'params'}}, {"key" => "pulseable", "value" =>"0"} );
						push (@{$feeds->{'params'}}, {"key" => "Level", "value" => "$v" } );

						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"SwitchType"} eq "Blinds") {
						#DevShutter
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevShutter", "room" => "Switches", params =>[]};
						my $v;
						if ($f->{"Status"} eq "Open") {$v=100;} else {$v=0;};
						my $bl=$f->{"Status"};my $rbl;
						if ($bl eq "Open") { $rbl=1;$device_tab{$f->{"idx"}}->{"Action"}=6;}
						elsif ($bl eq "Closed") { $rbl=0;$device_tab{$f->{"idx"}}->{"Action"}=6;};
						push (@{$feeds->{'params'}}, {"key" => "stopable", "value" =>"0"} );
						push (@{$feeds->{'params'}}, {"key" => "pulseable", "value" =>"0"} );
						push (@{$feeds->{'params'}}, {"key" => "Level", "value" => "$v" } );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif (($f->{"SwitchType"} eq "Venetian Blinds EU")||($f->{"SwitchType"} eq "Venetian Blinds US")) {
						#DevShutter
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevShutter", "room" => "Switches", params =>[]};
						my $v;
						if ($f->{"Status"} eq "Open") {$v=100;} else {$v=0;};
						my $bl=$f->{"Status"};my $rbl;
						if ($bl eq "Open") { $rbl=1;$device_tab{$f->{"idx"}}->{"Action"}=6;}
						elsif ($bl eq "Closed") { $rbl=0;$device_tab{$f->{"idx"}}->{"Action"}=6;};
						push (@{$feeds->{'params'}}, {"key" => "stopable", "value" =>"1"} );
						push (@{$feeds->{'params'}}, {"key" => "pulseable", "value" =>"0"} );
						push (@{$feeds->{'params'}}, {"key" => "Level", "value" => "$v" } );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"SwitchType"} eq "Motion Sensor") {
						#DevMotion	Motion security sensor
						#Status	Current status : 1 = On / 0 = Off	N/A
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevMotion", "room" => "Switches", params =>[]};
						push (@{$feeds->{'params'}}, { "key" => "Armable", "value" => "0" } );
						push (@{$feeds->{'params'}}, { "key" => "Ackable", "value" => "0" } );
						push (@{$feeds->{'params'}}, { "key" => "Armed", "value" => "1" } );
						push (@{$feeds->{'params'}}, { "key" => "Tripped", "value" => $rbl });
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"SwitchType"} eq "Door Lock") {
						#DevLock	Door / window lock
						#Status	Current status : 1 = On / 0 = Off	N/A
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevDoor", "room" => "Switches", params =>[]};
						push (@{$feeds->{'params'}}, { "key" => "Armable", "value" => "0" } );
						push (@{$feeds->{'params'}}, { "key" => "Ackable", "value" => "0" } );
						push (@{$feeds->{'params'}}, { "key" => "Armed", "value" => "1" } );
						push (@{$feeds->{'params'}}, { "key" => "Tripped", "value" => $rbl });
						push (@{$feed->{'devices'}}, $feeds );
					}elsif ($f->{"SwitchType"} eq "Smoke Detector") {
						#DevSmoke	Smoke security sensor
						#Armable	Ability to arm the device : 1 = Yes / 0 = No	N/A
						#Ackable	Ability to acknowledge alerts : 1 = Yes / 0 = No	N/A
						#Armed	Current arming status : 1 = On / 0 = Off	N/A
						#Tripped	Is the sensor tripped ? (0 = No - 1 = Tripped)	N/A				
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevSmoke", "room" => "Switches", params =>[]};
						push (@{$feeds->{'params'}}, { "key" => "Armable", "value" => "0" } );
						if ($f->{"Type"} eq "Security") {
							push (@{$feeds->{'params'}}, { "key" => "Ackable", "value" => "1" } );
						} else {
							push (@{$feeds->{'params'}}, { "key" => "Ackable", "value" => "0" } );
						}
						push (@{$feeds->{'params'}}, { "key" => "Armed", "value" => "1" } );
						push (@{$feeds->{'params'}}, { "key" => "Tripped", "value" => $rbl });
						#"GET http://192.168.0.24:8080/json.htm?type=command&param=resetsecuritystatus&idx=202&switchcmd=Normal"
						push (@{$feed->{'devices'}}, $feeds );				
					}
					#DevDoor	Door / window security sensor
					#DevFlood	Flood security sensor
					#DevCO2Alert	CO2 Alert sensor	
				} else {
					if ($f->{"Type"} eq "P1 Smart Meter") {
						#DevElectricity Electricity consumption sensor
						#Watts  Current consumption     Watt
						#ConsoTotal     Current total consumption       kWh
						#"Type" : "Energy", "SubType" : "CM180", "Usage" : "408 Watt", "Data" : "187.054 kWh"
						my ($usage)= ($f->{"Usage"} =~ /(\d+) Watt/);
						my ($total)= ($f->{"CounterToday"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						$total=ceil($total);
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
						if ($usage) {push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$usage, "unit" => "W"} );}
						 push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>$total, "unit" => "kWh"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Energy") {
						#DevElectricity Electricity consumption sensor
						#Watts  Current consumption     Watt
						#ConsoTotal     Current total consumption       kWh
						#"Type" : "Energy", "SubType" : "CM180", "Usage" : "408 Watt", "Data" : "187.054 kWh"
						my ($usage)= ($f->{"Usage"} =~ /(\d+) Watt/);
						my ($total)= ($f->{"Data"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						$total=ceil($total);
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
						push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$usage, "unit" => "W"} );
						 push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>$total, "unit" => "kWh"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Usage") {
						#DevElectricity Electricity consumption sensor
						#Watts  Current consumption     Watt
						#"Type" : "Usage", "SubType" : "Electric", "Data" : "122.3 Watt"
						my ($total)= ($f->{"Data"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						$total=ceil($total);
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
						push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$total, "unit" => "W"} );
					} elsif ($f->{"Type"} eq "Current/Energy") {
						#DevElectricity Electricity consumption sensor
						#Watts  Current consumption     Watt
						#ConsoTotal     Current total consumption       kWh
						#"Type" : "Energy", "SubType" : "CM180", "Usage" : "408 Watt", "Data" : "187.054 kWh"
						my ($L1,$L2,$L3,$tot)= split(/,/,$f->{"Data"});
						my ($l1)= ($L1 =~ /(\d+) Watt/);
						my ($l2)= ($L2 =~ /(\d+) Watt/);
						my ($l3)= ($L3 =~ /(\d+) Watt/);
						if ($l1) {	
							my $feeds={"id" => $f->{"idx"}."_L1", "name" => $name." L1", "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$l1, "unit" => "W"} );
							push (@{$feed->{'devices'}}, $feeds );
						}
						if ($l2) {	
							my $feeds={"id" => $f->{"idx"}."_L2", "name" => $name." L2", "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$l2, "unit" => "W"} );
							push (@{$feed->{'devices'}}, $feeds );
						}
						if ($l3) {	
							my $feeds={"id" => $f->{"idx"}."_L3", "name" => $name." L3", "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$l3, "unit" => "W"} );
							push (@{$feed->{'devices'}}, $feeds );
						}
					}  elsif (($f->{"Type"} =~ "Temp")||($f->{"Type"} =~ "Humidity"))  {
						my @type=split(/ \+ /,$f->{"Type"});
						my $cnt;
						foreach my $curs (@type) {
							$cnt++;
							if ($curs eq "Temp") {
								#DevTemperature Temperature sensor
								#Value  Current temperature     °C
								#"Temp" : 21.50,  "Type" : "Temp + Humidity" / Type" : "Temp",

								my $feeds={params =>[],"room" => "Temp","type" => "DevTemperature","name" => $name, "id" => $f->{"idx"}."_".$cnt};
								my $v=$f->{"Temp"};
								push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "°C"} );
								push (@{$feed->{'devices'}}, $feeds );
							} elsif ($curs eq "Humidity") {
								#DevHygrometry  Hygro sensor
								#Value  Current hygro value     %
								# "Humidity" : 52  "Type" : "Temp + Humidity" / Type" : "Humidity",

								my $feeds={"id" => $f->{"idx"}."_".$cnt, "name" => $name, "type" => "DevHygrometry", "room" => "Temp", params =>[]};
								my $v=$f->{"Humidity"};
								push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "%"} );
								push (@{$feed->{'devices'}}, $feeds );
							} elsif ($curs eq "Baro") {
								#DevPressure    Pressure sensor
								#Value  Current pressure        mbar
								#"Barometer" : 1022, "Type" : "Temp + Humidity + Baro"
								my $feeds={"id" => $f->{"idx"}."_".$cnt, "name" => $name, "type" => "DevPressure", "room" => "Temp", params =>[]};
								my $v=$f->{"Barometer"};
								push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "mbar"} );
								push (@{$feed->{'devices'}}, $feeds );
							}
						}
					}  elsif ($f->{"Type"} eq "Rain")  {
						#DevRain        Rain sensor
						#Value  Current instant rain value      mm/h
						#Accumulation   Total rain accumulation mm
						#"Rain" : "0.0", "RainRate" : "0.0", "Type" : "Rain"
								my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevRain", "room" => "Temp", params =>[]};
								my $v0=$f->{"RainRate"};
								my $v1=$f->{"Rain"};
								push (@{$feeds->{'params'}}, {"key" => "Accumulation", "value" => "$v1", "unit" => "mm"} );
								push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v0", "unit" => "mm/h"} );
								push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "UV")  {
						#DevUV  UV sensor
						#Value  Current UV index        index
						# "Type" : "UV","UVI" : "6.0"
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevUV", "room" => "Temp", params =>[]};
						my $v=$f->{"UVI"};
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Lux")  {
						#DevLux  Lux sensor
						#Value  Current Lux value        index
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevLuminosity", "room" => "Temp", params =>[]};
						my ($v)=($f->{"Data"}=~/(\d+) Lux/);
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Air Quality")  {
						#DevCO2  CO2 sensor
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevCO2", "room" => "Temp", params =>[]};
						my ($v)=($f->{"Data"}=~/(\d+) ppm/);
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "ppm"});
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Wind")  {
						#DevWind wind
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevWind", "room" => "Temp", params =>[]};
						my ($dir)=($f->{"Direction"}=~/(\d+)/);
						my ($speed)=($f->{"Speed"}=~/(\d+)/);
						push (@{$feeds->{'params'}}, {"key" => "Speed", "value" => "$speed", "unit" => "km/h"});
						push (@{$feeds->{'params'}}, {"key" => "Direction", "value" => "$dir", "unit" => "°"});
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "RFXMeter")  {
						if ($f->{"SwitchTypeVal"} eq "1") {
							#Gas
							my ($usage)= ($f->{"CounterToday"} =~ /(\d+) m3/);
							my ($total)= ($f->{"Counter"} =~ /([0-9]+(?:\.[0-9]+)?)/);
							$total=ceil($total);
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$usage, "unit" => "m3"} );
							 push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>$total, "unit" => "m3"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SwitchTypeVal"} eq "2") {
							#Water
							my ($usage)= ($f->{"CounterToday"} =~ /([0-9]+(?:\.[0-9]+)?)/);
							my ($total)= ($f->{"Counter"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							$total=ceil($total);
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$usage", "unit" => "m3"} );
							 push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>"$total", "unit" => "m3"} );
							push (@{$feed->{'devices'}}, $feeds );
							#Water by liter
							my $usage2=$usage*1000; #move to liters
							$feeds={"id" => $f->{"idx"}."_l", "name" => $name."_l", "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"$usage2", "unit"=> "L"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SwitchTypeVal"} eq "3") {
							#Counter
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevCounter", "room" => "Temp", params =>[]};
							my $v=$f->{"Counter"};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v"} );
							push (@{$feed->{'devices'}}, $feeds );
						} else {print STDERR "unk!\n";
						}
					} elsif ($f->{"Type"} eq "General")  {
							if ($f->{"SubType"} eq "Percentage") {
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "%"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Voltage") {
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "V"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Pressure") {
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevPressure", "room" => "Temp", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "mbar"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Visibility") {
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Temp", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "km"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Solar Radiation") {
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Temp", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "km"} );
							push (@{$feed->{'devices'}}, $feeds );
						}
					}
				}
			}; 
		}
	}
	#Get Scenes
	$system_url=config->{domo_path}."/json.htm?type=scenes";
	$json = $ua->get( $system_url );
	#warn "Could not get $system_url!" unless defined $json;
	if ($json->is_success) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
		if ($decoded->{'result'}) {
			@results = @{ $decoded->{'result'} };
			foreach my $f ( @results ) {
					my $dt = Time::Piece->strptime($f->{"LastUpdate"},"%Y-%m-%d %H:%M:%S");
	#	debug($dt->strftime("%Y-%m-%d %H:%M:%S"));
					my $name=$f->{"Name"};
					$name=~s/\s/_/;
					$name=~s/\s/_/;
					$name=~s/\//_/;
					$name=~s/%/P/;
					#DevScene       Scene (launchable)
					#LastRun        Date of last run        N/A
					#"idx" : "3", "Name" : "Alerte", "Type" : "Scenes", "LastUpdate" : "2014-03-18 22:17:18"
					my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevScene", "room" => "Scenes", params =>[]};
					my $v=$dt->strftime("%Y-%m-%d %H:%M:%S");
					push (@{$feeds->{'params'}}, {"key" => "LastRun", "value" => "$v"} );
					push (@{$feed->{'devices'}}, $feeds );
			}
		}
	}
	#Get Camera
	$system_url=config->{domo_path}."/json.htm?type=cameras";
debug($system_url);
	$json = $ua->get( $system_url );
	if ($json->is_success) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
		if ($decoded->{'result'}) {
			@results = @{ $decoded->{'result'} };
			foreach my $f ( @results ) {
					my $name=$f->{"Name"};
					$name=~s/\s/_/;
					$name=~s/\s/_/;
					$name=~s/\//_/;
					$name=~s/%/P/;
					my $feeds={"id" => $f->{"idx"}."_cam", "name" => $name, "type" => "DevCamera", "room" => "Switches", params =>[]};
					my $v=$f->{"ImageURL"};my $v2=config->{external_url_camera};my $v3=$f->{"VideoURL"};
					if ($v =~ /^http/) {
						push (@{$feeds->{'params'}}, {"key" => "localjpegurl", "value" => "$v"} );
					} else {
						if ($f->{"Username"}) {
							$v="http://".$f->{"Username"}.":".$f->{"Password"}."@".$f->{"Address"}.":".$f->{"Port"}."/".$f->{"ImageURL"};
							push (@{$feeds->{'params'}}, {"key" => "localjpegurl", "value" => "$v"} );
						} else {
							$v="http://".$f->{"Address"}.":".$f->{"Port"}."/".$f->{"ImageURL"};
							push (@{$feeds->{'params'}}, {"key" => "localjpegurl", "value" => "$v"} );
	
						}
					}
					if ($v2) {push (@{$feeds->{'params'}}, {"key" => "remotejpegurl", "value" => "$v2"} );}
					push (@{$feed->{'devices'}}, $feeds );
					# Now if VideoURL
					if ($v3) {
						my $feeds2={"id" => $f->{"idx"}."_video", "name" => $name, "type" => "DevCamera", "room" => "Switches", params =>[]};
						if ($f->{"Username"}) {
							$v="http://".$f->{"Username"}.":".$f->{"Password"}."@".$f->{"Address"}.":".$f->{"Port"}."/".$f->{"VideoURL"};
							push (@{$feeds2->{'params'}}, {"key" => "localjpegurl", "value" => "$v"} );
							} else {
							$v="http://".$f->{"Address"}.":".$f->{"Port"}."/".$f->{"VideoURL"};
							push (@{$feeds2->{'params'}}, {"key" => "localjpegurl", "value" => "$v"} );
							}
						push (@{$feed->{'devices'}}, $feeds2 );
						}
			}
		}
	}
	#DevGenericSensor      Generic sensor (any value)
	#Value  Current value   N/A



	return($feed);
	return { success => true};
};

true;
