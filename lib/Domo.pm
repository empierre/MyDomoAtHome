package Domo;
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# version 2 as published by the Free Software Foundation.
# Author: epierre <epierre@e-nef.com>
use Dancer ':syntax';
use File::Slurp;
use File::Spec;
use LWP::UserAgent;
use Crypt::SSLeay;
use utf8;
use Encode qw/ encode decode /;
use Time::Piece;
use DateTime;
use feature     qw< unicode_strings >;
use POSIX qw(ceil);
#use JSON;
use warnings;
use strict;
use Audio::MPD;


our $VERSION = '0.12';
set warnings => 0;
my %device_tab;
my %device_list;
my $last_version;    #last version in github
my $last_version_dt; # last version text in github
my @unk_dev;         # list of unknown devices

hook(
   after_serializer => sub {
       my $response = shift;
       $response->{encoded} = 1;
   }
);

set serializer => 'JSON'; 
set 'database'     => File::Spec->catfile( config->{domo_db});
prefix undef;

my $mpd_host=config->{volumio_path};
my $mpd;

get '/' => sub {
    template 'index';
};

get '/rooms' => sub {
       #Room list
  return {"rooms" => [ 
		{ "id"=> "Switches", "name"=> "Switches" },
		{ "id"=> "Scenes", "name"=> "Scenes" },
		{ "id"=> "Temp", "name"=> "Weather" },
		{ "id"=> "Utility", "name"=> "Utility" },
		{ "id"=> "Volumio", "name"=> "Volumio" },
			]};
};

get '/system' => sub {
 return {"id"=> "MyDomoAtHome","apiversion"=> 1};
};

get '/devices/:deviceId/:paramKey/histo/:startdate/:enddate' => sub {
	my $deviceId = params->{deviceId};
	my $paramKey = params->{paramKey}||"";
	my $startdate = params->{startdate}||"";
	my $enddate = params->{enddate}||"";

	my $type=lc(&getDeviceType($deviceId));
	my $ptype=$type;
debug("TYPE:$type\n");
 print "TYPE:$type\n";
	if (($paramKey eq "hygro")) {$type="temp";}
	if (($paramKey eq "temp")) {$type="temp";}
	if (($type eq "lux")||($type eq "energy")||($type eq "counter")||($type="air quality")) {$type="counter";}
	if (($ptype eq "general")) {$type="Percentage";}
 print "TYPE:$type\n";

	my $feed={ "values" => []};
	my $url=config->{domo_path}."/json.htm?type=graph&sensor=$type&idx=$deviceId&range=day";
	my $decoded;
	my @results=();
debug($url);
	my $ua = LWP::UserAgent->new();
	$ua->agent("MyDomoREST/$VERSION");
	my $json = $ua->get( $url );
	if ($json->is_success) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
		if ($decoded->{'result'}) {
			@results = @{ $decoded->{'result'} };
			my $f={};
			foreach $f ( @results ) {
					my $dt = Time::Piece->strptime($f->{"d"},"%Y-%m-%d %H:%M:%SS");
					#print $dt->epoch." \n";
					if ((($paramKey eq "temp")&&($f->{"te"}))||($type eq "temp")) {
							my $value=$f->{"te"};
							my $date=$dt->epoch*1000;
							my $feeds={"date" => "$date", "value" => "$value"};
							push (@{$feed->{'values'}}, $feeds );
					} elsif ((($paramKey eq "hygro")&&($f->{"hu"}))||($type eq "Humidity")) {
							my $value=$f->{"hu"};
							my $date=$dt->epoch*1000;
							my $feeds={"date" => "$date", "value" => "$value"};
							push (@{$feed->{'values'}}, $feeds );
					} elsif (($ptype eq "air quality")) {
							my $value=$f->{"co2"};
							my $date=$dt->epoch*1000;
							my $feeds={"date" => "$date", "value" => "$value"};
							push (@{$feed->{'values'}}, $feeds );
					} elsif (($type eq "counter")||($type eq "Percentage")) {
							my $value=$f->{"v"};
							my $date=$dt->epoch*1000;
							my $feeds={"date" => "$date", "value" => "$value"};
							push (@{$feed->{'values'}}, $feeds );
					} elsif ($f->{"mm"}) {
						my $value=$f->{"mm"};
						my $date=$dt->epoch*1000;
						my $feeds={"date" => "$date", "value" => "$value"};
						push (@{$feed->{'values'}}, $feeds );
					} elsif ($f->{"uvi"}) {
						my $value=$f->{"uvi"};
						my $date=$dt->epoch*1000;
						my $feeds={"date" => "$date", "value" => "$value"};
						push (@{$feed->{'values'}}, $feeds );
					} elsif ($f->{"v"}) {
						my $value=$f->{"v"};
						my $date=$dt->epoch*1000;
						my $feeds={"date" => "$date", "value" => "$value"};
						push (@{$feed->{'values'}}, $feeds );
					} elsif ($f->{"sp"}) {
						my $value=$f->{"sp"};
						my $date=$dt->epoch*1000;
						my $feeds={"date" => "$date", "value" => "$value"};
						push (@{$feed->{'values'}}, $feeds );
					}
					#di direction
					#gu gust
					#v counter percentage
					#
				}
			return to_json($feed, { utf8 => 1} );
			return { success => true};
		} else {
			status 'error';
			return { success => false};
		}
	} else {
		status 'error';
		return { success => false};
	}
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
	#/json.htm?type=command&param=switchlight&idx=&switchcmd=Set%20Level&level=6
	my $url;
	if (($device_tab{$deviceId}->{"Action"}==2)or($device_tab{$deviceId}->{"Action"}==3)) {
		if ($actionParam eq "100") {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=On&level=$actionParam&passcode=";
		} else {
			my $setLevel=ceil($actionParam*$device_tab{$deviceId}->{"MaxDimLevel"}/100);
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Off&level=$setLevel&passcode=";
		}
	} elsif (($device_tab{$deviceId}->{"Action"}==5)) {
		#Blinds inverted
		if ($actionParam eq "100") {
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=On&level=0&passcode=";
		} else {
			my $setLevel=ceil($actionParam*$device_tab{$deviceId}->{"MaxDimLevel"}/100);
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Off&level=$setLevel&passcode=";
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
			my $setLevel=ceil($actionParam*$device_tab{$deviceId}->{"MaxDimLevel"}/100);
			$url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=Set%20Level&level=$setLevel&passcode=";
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
	} elsif ($actionName eq 'setSetPoint') {
		#DevThermostat
		my $url=config->{domo_path}."/json.htm?type=setused&idx=$deviceId&used=true&setpoint=$actionParam";
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
	} elsif ($actionName eq 'setColor') {
			my $url=config->{domo_path}."/json.htm?type=command&param=setcolorbrightnessvalue&idx=$deviceId&passcode=";
		debug($url);
			my $browser = LWP::UserAgent->new;
			my $response = $browser->get($url);
			if ($response->is_success){ 
				return { success => true};
			} else {
				status 'error';
				return { success => false, errormsg => $response->status_line};
			}
	} elsif ($actionName eq 'setChoice') {
		if ($deviceId=~/^S/) {
			my ($sc)=$deviceId=~/S(\d+)/;
			my $url=config->{domo_path}."/json.htm?type=command&param=switchscene&idx=$sc&switchcmd=$actionParam&passcode=";
		debug($url);
			my $browser = LWP::UserAgent->new;
			my $response = $browser->get($url);
			if ($response->is_success){ 
				return { success => true};
			} else {
				status 'error';
				return { success => false, errormsg => $response->status_line};
			}
		} elsif ($deviceId=~/^V/) {
			my ($sc)=$deviceId=~/V(\d+)/;
			if ($actionParam eq "play") {
				$mpd->play;
			}elsif ($actionParam eq "pause") {
				$mpd->pause;
			}elsif ($actionParam eq "stop") {
				$mpd->stop;
			}elsif ($actionParam eq "next") {
				$mpd->next;
			}elsif ($actionParam eq "prev") {
				$mpd->next;
			}elsif ($actionParam eq "volumeUP") {
				$mpd->volume("+1");
			}elsif ($actionParam eq "volumeDOWN") {
				$mpd->volume("-1");
			}
		} else {
			status 'error';
			return { success => false, errormsg => "not implemented"};
		}
	} elsif ($actionName eq 'setMode') {
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
	my $t_unit="°C";
	my $system_url = config->{domo_path}."/json.htm?type=devices&filter=all&used=true&order=Name";
	my $decoded;
	my @results;
debug($system_url);
	my $ua = LWP::UserAgent->new();
	$ua->agent("MyDomoREST/$VERSION");
	my $json = $ua->get( $system_url );
	if ($json->is_success) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(1)->decode( $json->decoded_content );
		if ($decoded->{'result'}) {
			@results = @{ $decoded->{'result'} };
			#Own device version
			my $feeds={"id" => "S0", "name" => "MyDomoAtHome", "type" => "DevGenericSensor",  params =>[]};
			my $ver="$VERSION";
			push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"$ver", "unit"=> "", "graphable" => "false"} );
			push (@{$feed->{'devices'}}, $feeds );
			#Check for new version
			my @and=&getLastVersion();
			my $an1;my $an2;
			if (($ver ne $and[0])&&($and[0] ne "err")) {
				my $feeds={"id" => "S1", "name" => "New version found", "type" => "DevGenericSensor",  params =>[]};
				$an1=$and[0];
				push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"$an1", "unit"=> "", "graphable" => "false"} );
				push (@{$feed->{'devices'}}, $feeds );
			}
			#
			#Parse the devices tree
			#
			foreach my $f ( @results ) {
					my $dt = Time::Piece->strptime($f->{"LastUpdate"},"%Y-%m-%d %H:%M:%S");
					my $name=$f->{"Name"};
					#$name=~s/\s/_/;
					#$name=~s/\s/_/;
					#$name=~s/\//_/; 
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

					if ((($f->{"SwitchType"} eq "On/Off")and($f->{"SubType"} ne "RGBW"))or($f->{"SwitchType"} eq "Contact")or($f->{"SwitchType"} eq "Dusk Sensor")) {
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevSwitch", "room" => "Switches", params =>[]};
						push (@{$feeds->{'params'}}, {"key" => "Status", "value" =>"$rbl"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif (($f->{"SwitchType"} eq "Push On Button")or($f->{"SwitchType"} eq "Push Off Button")) {
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevSwitch", "room" => "Switches", params =>[]};
						if ($f->{"SwitchType"} eq "Push Off Button") {$rbl="0"};
						if ($f->{"SwitchType"} eq "Push On Button") {$rbl="1"};
						push (@{$feeds->{'params'}}, {"key" => "Status", "value" =>"$rbl"} );
						#push (@{$feeds->{'params'}}, {"key" => "pulseable", "value" =>"1"} );
						#push (@{$feeds->{'params'}}, {"key" => "Level", "value" =>"$rbl"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif (($f->{"SwitchType"} eq "On/Off")and($f->{"SubType"} eq "RGBW")) {
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevRGBLight", "room" => "Switches", params =>[]};
						push (@{$feeds->{'params'}}, {"key" => "Status", "value" =>"$rbl"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif (($f->{"SwitchType"} eq "Dimmer")||($f->{"SwitchType"} eq "Doorbell")) {
						#DevDimmer	Dimmable light
						#Status	Current status : 1 = On / 0 = Off	N/A
						#Level	Current dim level (0-100)	%
						#"idx" : "3", "Name" : "Alerte",  "Level" : 0,  "SwitchType" : "Dimmer",  "Status" : "Off","LastUpdate" : "2014-03-18 22:17:18"
						if ($rbl=~/Set Level/) {$rbl=1;}
						$device_tab{$f->{"idx"}}->{"MaxDimLevel"} = $f->{"MaxDimLevel"};
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
					} elsif (($f->{"SwitchType"} eq "Unknown")||($f->{"SwitchTypeVal"} eq "16")) {
						#DevShutter
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevShutter", "room" => "Switches", params =>[]};
						my $v=$f->{"Level"};

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
					if ((($f->{"Type"} eq "P1 Smart Meter") and ($f->{"SubType"} eq "Energy")) or (($f->{"Type"} eq "YouLess Meter") and ($f->{"SubType"} eq "YouLess counter")) ) {
						#DevElectricity Electricity consumption sensor
						#Watts  Current consumption     Watt
						#ConsoTotal     Current total consumption       kWh
						#"Type" : "Energy", "SubType" : "CM180", "Usage" : "408 Watt", "Data" : "187.054 kWh"
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
						my $usage;
						if ($f->{"Usage"}) {
							($usage)= ($f->{"Usage"} =~ /(\d+) Watt/);
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$usage", "unit" => "W", "graphable" => "true"} );
						} elsif ($f->{"Counter"}) {
							($usage)= ($f->{"Counter"} =~ /(\d+) Watt/);
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$usage", "unit" => "W", "graphable" => "true"} );
						}
						my ($total)= ($f->{"CounterToday"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						$total=ceil($total);
						push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>"$total", "unit" => "kWh"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif (($f->{"Type"} eq "P1 Smart Meter") and ($f->{"SubType"} eq "Gas"))  {
						# (Dutch)P1 Gas Meter
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
						my ($usage)= ($f->{"CounterToday"} =~ /(\d+) m3/);
						my ($total)= ($f->{"Counter"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$usage", "unit" => "m3"} );
						push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>"$total", "unit" => "m3"} );
						push (@{$feed->{'devices'}}, $feeds );
						
						# Generic Sensor showing today's value
						my ($usage_today)= ($f->{"CounterToday"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						$feeds={"id" => $f->{"idx"}."_today", "name" => $name."_today", "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"$usage_today", "unit"=> "m3", "graphable" => "true"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Energy") {
						#DevElectricity Electricity consumption sensor
						#Watts  Current consumption     Watt
						#ConsoTotal     Current total consumption       kWh
						#"Type" : "Energy", "SubType" : "CM180", "Usage" : "408 Watt", "Data" : "187.054 kWh"
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
						#if ($f->{"Usage"}) {
							my $usage;
							($usage)= ($f->{"Usage"} =~ /(\d+) Watt/);
							if (!$usage) {$usage="0";}
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$usage", "unit" => "W"} );#}
						my ($total)= ($f->{"Data"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						$total=ceil($total);
						 push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>"$total", "unit" => "kWh", "graphable" => "true"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Usage") {
						#DevElectricity Electricity consumption sensor
						#Watts  Current consumption     Watt
						#"Type" : "Usage", "SubType" : "Electric", "Data" : "122.3 Watt"
						my ($total)= ($f->{"Data"} =~ /([0-9]+(?:\.[0-9]+)?)/);
						$total=ceil($total);
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
						push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$total", "unit" => "W"} );
						push (@{$feed->{'devices'}}, $feeds );
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
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$l1", "unit" => "W"} );
							push (@{$feed->{'devices'}}, $feeds );
						}
						if ($l2) {	
							my $feeds={"id" => $f->{"idx"}."_L2", "name" => $name." L2", "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$l2", "unit" => "W"} );
							push (@{$feed->{'devices'}}, $feeds );
						}
						if ($l3) {	
							my $feeds={"id" => $f->{"idx"}."_L3", "name" => $name." L3", "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$l3", "unit" => "W"} );
							push (@{$feed->{'devices'}}, $feeds );
						}
					}  elsif (($f->{"Type"} =~ "Temp")||($f->{"Type"} =~ "Humidity"))  {
						if (($f->{"Type"} =~ "Temp")&&($f->{"Type"} =~ "Humidity")) {
							my $feeds;
							$feeds={params =>[],"room" => "Temp","type" => "DevTempHygro","name" => $name, "id" => $f->{"idx"}};

							my $v=$f->{"Temp"};
							push (@{$feeds->{'params'}}, {"key" => "temp", "value" => "$v", "unit" => $t_unit, "graphable" => "true"} );
							my $vh=$f->{"Humidity"};
							push (@{$feeds->{'params'}}, {"key" => "hygro", "value" => "$vh", "unit" => "%", "graphable" => "true" });
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"Type"} eq "Temp") {
							#DevTemperature Temperature sensor
							#Value  Current temperature     *C
							#"Temp" : 21.50,  "Type" : "Temp + Humidity" / Type" : "Temp",
							$device_tab{$f->{"idx"}}->{"graph"} = 'te';
							my $feeds;
							$feeds={params =>[],"room" => "Temp","type" => "DevTemperature","name" => $name, "id" => $f->{"idx"}};
							my $v=$f->{"Temp"};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => $t_unit, "graphable" => "true"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"Type"} eq "Humidity") {
							#DevHygrometry  Hygro sensor
							#Value  Current hygro value     %
							# "Humidity" : 52  "Type" : "Temp + Humidity" / Type" : "Humidity",
							$device_tab{$f->{"idx"}}->{"graph"} = 'hu';

							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevHygrometry", "room" => "Temp", params =>[]};
							my $v=$f->{"Humidity"};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "%", "graphable" => "true" });
							push (@{$feed->{'devices'}}, $feeds );
						}
					 	if ($f->{"Type"} =~ "Baro") {
							#DevPressure    Pressure sensor
							#Value  Current pressure        mbar
							#"Barometer" : 1022, "Type" : "Temp + Humidity + Baro"
							my $idx=$f->{"idx"};
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							if ($f->{"Type"} eq "Temp + Humidity + Baro") {$idx=$idx."_1"};
							my $feeds={"id" => $idx, "name" => $name, "type" => "DevPressure", "room" => "Temp", params =>[]};
							my $v=$f->{"Barometer"};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "mbar"} );
								push (@{$feed->{'devices'}}, $feeds );
						}
					}  elsif ($f->{"Type"} eq "Rain")  {
						#DevRain        Rain sensor
						#Value  Current instant rain value      mm/h
						#Accumulation   Total rain accumulation mm
						#"Rain" : "0.0", "RainRate" : "0.0", "Type" : "Rain"
						$device_tab{$f->{"idx"}}->{"graph"} = 'mm';
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevRain", "room" => "Temp", params =>[]};
						my $v0=$f->{"RainRate"};
						my $v1=$f->{"Rain"};
						push (@{$feeds->{'params'}}, {"key" => "Accumulation", "value" => "$v1", "unit" => "mm", "graphable" => "true"} );
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v0", "unit" => "mm/h"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "UV")  {
						#DevUV  UV sensor
						#Value  Current UV index        index
						# "Type" : "UV","UVI" : "6.0"
						$device_tab{$f->{"idx"}}->{"graph"} = 'uvi';
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevUV", "room" => "Temp", params =>[]};
						my $v=$f->{"UVI"};
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "graphable" => "true"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Lux")  {
						#DevLux  Lux sensor
						#Value  Current Lux value        index
						$device_tab{$f->{"idx"}}->{"graph"} = 'v';
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevLuminosity", "room" => "Temp", params =>[]};
						my ($v)=($f->{"Data"}=~/(\d+) Lux/);
						$device_tab{$f->{"idx"}}->{"graph"} = 'uvi';
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "graphable" => "true"} );
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Air Quality")  {
						#DevCO2  CO2 sensor
						$device_tab{$f->{"idx"}}->{"graph"} = 'v';
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevCO2", "room" => "Temp", params =>[]};
						my ($v)=($f->{"Data"}=~/(\d+) ppm/);
						$device_tab{$f->{"idx"}}->{"graph"} = 'v';
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "ppm", "graphable" => "true"});
						push (@{$feed->{'devices'}}, $feeds );
					} elsif ($f->{"Type"} eq "Wind")  {
						#DevWind wind
						$device_tab{$f->{"idx"}}->{"graph"} = 'sp';
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevWind", "room" => "Temp", params =>[]};
						my ($dir)=($f->{"Direction"}=~/(\d+)/);
						my ($speed)=($f->{"Speed"}=~/(\d+)/);
						push (@{$feeds->{'params'}}, {"key" => "Speed", "value" => "$speed", "unit" => "km/h", "graphable" => "true"});
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
							my $totalm3=ceil($total);
							my $usagem3=ceil($usage/1000);
							my $feeds={"id" => $f->{"idx"}, "name" => "$name", "type" => "DevElectricity", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>"$usagem3", "unit" => "m3", "graphable" => "true"} );
							 push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>"$totalm3", "unit" => "m3"} );
							push (@{$feed->{'devices'}}, $feeds );
							#Water by liter
							my $usage2=$usage; #move to liters
							$feeds={"id" => $f->{"idx"}."_l", "name" => $name."_l", "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"$usage2", "unit"=> "L"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif (($f->{"SwitchTypeVal"} eq "3")||($f->{"SubType"} eq "RFXMeter counter")) {
							#Counter
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevCounter", "room" => "Temp", params =>[]};
							my $v=$f->{"Counter"};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v"} );
							push (@{$feed->{'devices'}}, $feeds );
						} else {
							push @unk_dev,$f->{"idx"}."-".$f->{"Name"}."-".$f->{"Type"}."-".$f->{"SubType"}."-".$f->{"SwitchTypeVal"};
						}
					} elsif ($f->{"Type"} eq "General")  {
							if ($f->{"SubType"} eq "Percentage") {
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "%", "graphable" => "true"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Voltage") {
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "V"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Pressure") {
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevPressure", "room" => "Temp", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "mbar", "graphable" => "true"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Visibility") {
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Temp", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "km"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Solar Radiation") {
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Temp", params =>[]};
							my ($v)= ($f->{"Data"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "Watt/m2"} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif (($f->{"SubType"} eq "Text")||($f->{"SubType"} eq "Alert")||($f->{"SubType"} eq "Unknown")) {	   
	    						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevGenericSensor", "room" => "Utility", params =>[]};
							my $v= $f->{"Data"};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => ""} );
							push (@{$feed->{'devices'}}, $feeds );
						} elsif ($f->{"SubType"} eq "Sound Level") {	   
							$device_tab{$f->{"idx"}}->{"graph"} = 'v';
							my ($v)= ($f->{"Data"} =~ /^([0-9]+) dB/);
	    						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevNoise", "room" => "Utility", params =>[]};
							push (@{$feeds->{'params'}}, {"key" => "Value", "value" => "$v", "unit" => "dB", graphable => "true"} );
							push (@{$feed->{'devices'}}, $feeds );
						} else { 
							push @unk_dev,$f->{"idx"}."-".$f->{"Name"}."-".$f->{"Type"}."-".$f->{"SubType"}."-".$f->{"SwitchTypeVal"};
						}
					} elsif (($f->{"SubType"})&&($f->{"SubType"} eq "SetPoint")) {
							my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevThermostat", "room" => "Temp", params =>[]};
							my ($v)= ($f->{"SetPoint"} =~ /^([0-9]+(?:\.[0-9]+)?)/);
							push (@{$feeds->{'params'}}, {"key" => "cursetpoint", "value" => "$v"});
							push (@{$feeds->{'params'}}, {"key" => "curtemp", "value" => "$v", "unit"=>$t_unit} );
							push (@{$feeds->{'params'}}, {"key" => "step", "value" => "0.5"} );
							push (@{$feeds->{'params'}}, {"key" => "curmode", "value" => "default"} );
							push (@{$feeds->{'params'}}, {"key" => "availablemodes", "value" => "default"} );
							push (@{$feed->{'devices'}}, $feeds );
					} else {
						#catchall
						if ($f->{"idx"}>5) {push @unk_dev,$f->{"idx"}."-".$f->{"Name"}."-".$f->{"Type"}."-".$f->{"SubType"}."-".$f->{"SwitchTypeVal"};}					}
				}
			}; 
		}

		#Unknown device list
		my $ind_unk=2;
		foreach my $devt ( @unk_dev)  {
			#my $feeds={"id" => "S".$ind_unk++, "name" => "$devt", "type" => "DevGenericSensor", "room" => "noroom", params =>[]};
			#push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"unk", "unit"=> "", "graphable" => "false"} );
			#push (@{$feed->{'devices'}}, $feeds );
		}
	} else {
		my $feeds={"id" => "S00", "name" => "Unable to connect to Domoticz", "type" => "DevGenericSensor",  params =>[]};
		my $ver=config->{domo_path};
		push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"$ver", "unit"=> "", "graphable" => "false"} );
		push (@{$feed->{'devices'}}, $feeds );
		$feeds={"id" => "S01", "name" => "Please add this gateway in Setup/settings/Local Networks", "type" => "DevGenericSensor",  params =>[]};
		push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>"", "unit"=> "", "graphable" => "false"} );
		push (@{$feed->{'devices'}}, $feeds );
	}

	#MPD
	if ($mpd_host ne '') {
		$mpd=Audio::MPD->new ( host => $mpd_host);
	}
	#Status
	if ($mpd_host) {
		my $status = $mpd->status;
		my $song = $mpd->current;
		my $feeds={"id" => "V2", "name" => $song->artist." - ".$song->album, "type" => "DevMultiSwitch", "room" => "Volumio", params =>[]};
		push (@{$feeds->{'params'}}, {"key" => "Value", "value" =>$status->state, "unit"=> "", "graphable" => "false"} );
		push (@{$feeds->{'params'}}, {"key" => "Choices", "value" => "play,stop,pause,next,prev,volumeUP,volumeDOWN"});
		push (@{$feed->{'devices'}}, $feeds );
	}

	#Get Scenes
	$system_url=config->{domo_path}."/json.htm?type=scenes";
	$json = $ua->get( $system_url );
	#warn "Could not get $system_url!" unless defined $json;
	if ($json->is_success) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(1)->decode( $json->decoded_content );
		if ($decoded->{'result'}) {
			@results = @{ $decoded->{'result'} };
			foreach my $f ( @results ) {
					my $dt = Time::Piece->strptime($f->{"LastUpdate"},"%Y-%m-%d %H:%M:%S");
	#	debug($dt->strftime("%Y-%m-%d %H:%M:%S"));
					my $name=$f->{"Name"};
					$name=~s/%/P/;
					#DevScene       Scene (launchable)
					#LastRun        Date of last run        N/A
					#"idx" : "3", "Name" : "Alerte", "Type" : "Scenes", "LastUpdate" : "2014-03-18 22:17:18"
					if ($f->{"Type"} eq "Group") {
						my $feeds={"id" => "S".$f->{"idx"}, "name" => $name, "type" => "DevMultiSwitch", "room" => "Scenes", params =>[]};
						my $v=$dt->strftime("%Y-%m-%d %H:%M:%S");
						push (@{$feeds->{'params'}}, {"key" => "LastRun", "value" => "$v"} );
						push (@{$feeds->{'params'}}, {"key" => "Value", "value" => $f->{"Status"}} );
						push (@{$feeds->{'params'}}, {"key" => "Choices", "value" => "Mixed,On,Off"} );
						push (@{$feed->{'devices'}}, $feeds );

					} else {
						my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevScene", "room" => "Scenes", params =>[]};
						my $v=$dt->strftime("%Y-%m-%d %H:%M:%S");
						push (@{$feeds->{'params'}}, {"key" => "LastRun", "value" => "$v"} );
						push (@{$feed->{'devices'}}, $feeds );
					}
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


	
	return to_json($feed, { utf8 => 1} );
	return { success => true};
};

sub getDeviceType($) {
	my ($deviceId)=@_;
	my $url=config->{domo_path}."/json.htm?type=devices&rid=$deviceId";
	my $decoded;
	my @results;
debug($url);
	my $ua = LWP::UserAgent->new();
	$ua->agent("MyDomoREST/$VERSION");
	my $json = $ua->get( $url );
	if ($json->is_success) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
		if ($decoded->{'result'}) {
			@results = @{ $decoded->{'result'} };
			foreach my $f ( @results ) {
				if ($f->{SubType} eq "RFXMeter counter") {
					return("counter");
				} else {
					return($f->{Type});
				}
			}
		}
	}
}
sub getLastVersion() {
	my $dt = DateTime->now();
	if ($last_version_dt < $dt->add( hours => 4 )) {
		my @res;
		push @res,$last_version;
		push @res,"";
		return(@res);
	} else {
		my $url="https://api.github.com/repos/empierre/MyDomoAtHome/releases/latest";
		my $decoded;
		my @results;
	debug($url);
		my $ua = LWP::UserAgent->new();
		$ua->agent("MyDomoREST/$VERSION");
		my $json = $ua->get( $url );
		if ($json->is_success) {
			# Decode the entire JSON
			$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
			if ($decoded) {
				my @res;
				push @res,$decoded->{tag_name};
				push @res,$decoded->{body};
				$last_version_dt=DateTime->now;
				$last_version=$decoded->{tag_name};
				return(@res);
			}
		} else {return "err";}
	}
}
1;
