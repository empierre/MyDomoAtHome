package Domo;
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# version 2 as published by the Free Software Foundation.
# Author: epierre
use Dancer ':syntax';
use DBI;
use File::Spec;
use File::Slurp;
use LWP::UserAgent;
use Crypt::SSLeay;
use utf8;
use Time::Piece;
use Device::SerialPort;
use IO::Handle;
use feature     qw< unicode_strings >;
#use JSON;

our $VERSION = '0.2';
set warnings => 0;
set 'database'     => File::Spec->catfile(File::Spec->tmpdir(), 'mysensors.db');


set serializer => 'JSON'; 
prefix undef;
# USB port opening
my $ob = &connect_usb(config->{usb_port});
my $domo_ip = config->{domo_ip};
my $domo_port = config->{domo_port};
my %sensor_tab;

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


get '/devices/:deviceId/action/:actionName/:actionParam?' => sub {
my $deviceId = params->{deviceId};
my $actionName = params->{actionName};
my $actionParam = params->{actionParam}||"";
};

get '/message/:radioId/:childId/:messageType/:subType/:payload?' => sub {
	my $radioId = params->{radioId};
	my $childId = params->{childId};
	my $messageType = params->{messageType};
	my $subType = params->{subType};
	my $payload = params->{payload}||"0";

	my $dt = DateTime->now;
	my $date=join ' ', $dt->ymd, $dt->hms;
	 
	
	if ($messageType==4) {
		#I_RELAY_NODE 		1 255 4 7 0 
		#I_SKETCH_NAME 		1 255 4 14 Humidity
		#I_SKETCH_VERSION 	1 255 4 15 1.0

		if ($subType==5) {
		#Gives a new node its ID
			my $db = connect_db();
			my $sql = "insert into device (I_BATTERY_LEVEL,I_RELAY_NODE,I_UNIT) values (100,255,'M')";
			my $sth = $db->prepare($sql) or die $db->errstr;
			$sth->execute or die $sth->errstr;
			#get the id
			$sql = 'SELECT last_insert_rowid() FROM device';
			$sth = $db->prepare($sql) or die $db->errstr;
			$sth->execute or die $sth->errstr;
			my $row;my $id;while($row = $sth->fetchrow_hashref()) { $id=$row->{id};}			
           	my $msg = "$radioId;$childId;4;5;$id\n";
            my $co = $ob->write($msg);
            if (!$co) {
					status 'error';
					return { success => false, errormsg => "USB write failed"};					
			}
            $ob->write_drain;
			return { success => true};					
		}
		if ($subType==9) {
		#I_PING
             my $msg = "$radioId;$childId;4;10;\n";
             my $co = $ob->write($msg);
             if (!$co) {
					status 'error';
					return { success => false, errormsg => "USB write failed"};					
			 }
             $ob->write_drain;
			 return { success => true};					
		}
		if ($subType==13) {
		#Answer we are Metric
		#I_UNIT 			1 255 4 13 0
             my $msg = "$radioId;$childId;4;13;M\n";
             my $co = $ob->write($msg);
             if (!$co) {
					status 'error';
					return { success => false, errormsg => "USB write failed"};					
			 }
             $ob->write_drain;
			 return { success => true};					
		}
    } elsif ($messageType==1) {
		$sensor_tab{$radioId}->{$subType}=$payload;
		&update_sensor($radioId,$subType,$payload);
		if($subType==0) {
		# Read the Temp value
	  		 my $hum=$sensor_tab{$radioId}->{1}||0;
			 next if ($hum<=0);		
			 `curl -s "http://$domo_ip:$domo_port/json.htm?type=command&param=udevice&idx=164&svalue=$payload;$hum;2" &`;
			 return { success => true};					
		}
		if ($subType==1) {
			# Read the Humidity value
			my $temp=$sensor_tab{$radioId}->{0}||0;
			next if ($temp<=0);
			`curl -s "http://$domo_ip:$domo_port/json.htm?type=command&param=udevice&idx=164&svalue=$temp;$payload;2" &`;
			return { success => true};					
		} 
	} elsif ($messageType==3) {
	#Variable Acknowledgments	
	} elsif ($messageType==0) {
	#Presentation	
	#1 255 0 17 1.3b3 (67f4ca1)
	#S_ARDUINO_NODE		17	Arduino node device
	#S_ARDUINO_RELAY	18	Arduino relaying node device
		if ($subType==17) {
			my $db = connect_db();
			my $sql = 'insert into sensor (device_id, subtype,version) values (?, ?, ?)';
			my $sth = $db->prepare($sql) or die $db->errstr;
			$sth->execute($radioId, ) or die $sth->errstr;
		}	
	};

if ($actionName eq 'setStatus') {
        #setStatus	0/1
	my $action;
	if ($actionParam eq 0) {
		$action="Off";
	} else {
		$action="On";
	}
	my $url=config->{domo_path}."/json.htm?type=command&param=switchlight&idx=$deviceId&switchcmd=$action&level=0&passcode=";
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
	status 'error';
	return { success => false, errormsg => "not implemented"};
} elsif ($actionName eq 'setLevel') {
	#setLevel	0-100
	#/json.htm?type=command&param=switchlight&idx=&switchcmd=Set%20Level&level=6
	return { success => true};
} elsif ($actionName eq 'stopShutter') {
	#stopShutter
	status 'error';
	return { success => false, errormsg => "not implemented"};
} elsif ($actionName eq 'pulseShutter') {
	#pulseShutter	up/down
	status 'error';
	return { success => false, errormsg => "not implemented"};
} elsif ($actionName eq 'launchScene') {
	#launchScene
	#/json.htm?type=command&param=switchscene&idx=&switchcmd=
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
debug($system_url);
	my $ua = LWP::UserAgent->new();
	$ua->agent("MyDomoREST/$VERSION");
	my $json = $ua->get( $system_url );
	warn "Could not get $system_url!" unless defined $json;
	# Decode the entire JSON
	my $decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
	my @results = @{ $decoded->{'result'} };
	foreach my $f ( @results ) {
			my $dt = Time::Piece->strptime($f->{"LastUpdate"},"%Y-%m-%d %H:%M:%S");
			my $name=$f->{"Name"};
			$name=~s/\s/_/;
			$name=~s/\s/_/;
			$name=~s/\//_/;
			$name=~s/%/P/;
		 if ($f->{"SwitchType"}) {			
			#print $f->{"idx"} . " " . $f->{"Name"} . " " . $f->{"Status"} . $f->{"LastUpdate"}."\n";
			$name.="_E";
			my $bl=$f->{"Status"};my $rbl;
			if ($bl eq "On") { $rbl=1;}
			elsif ($bl eq "Off") { $rbl=0;}
			elsif ($bl eq "Opened") { $rbl=1;}
			elsif ($bl eq "Closed") { $rbl=0;}
			else { $rbl=$bl;}
			if ($f->{"SwitchType"} eq "On/Off") {
				my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevSwitch", "room" => "Switches", params =>[]};
				push (@{$feeds->{'params'}}, {"key" => "Status", "value" =>"$rbl"} );
				push (@{$feed->{'devices'}}, $feeds );
			} elsif ($f->{"SwitchType"} eq "Dimmer") {
				#DevDimmer	Dimmable light
				#Status	Current status : 1 = On / 0 = Off	N/A
				#Level	Current dim level (0-100)	%
				#"idx" : "3", "Name" : "Alerte",  "Level" : 0,  "SwitchType" : "Dimmer",  "Status" : "Off","LastUpdate" : "2014-03-18 22:17:18"
				my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevDimmer", "room" => "Switches", params =>[]};

				push (@{$feeds->{'params'}}, {"key" => "Status", "value" =>"$rbl"} );
				push (@{$feeds->{'params'}}, {"key" => "Level", "value" => $f->{"Level"} } );

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
				push (@{$feeds->{'params'}}, { "key" => "Ackable", "value" => "0" } );
				push (@{$feeds->{'params'}}, { "key" => "Armed", "value" => "1" } );
				push (@{$feeds->{'params'}}, { "key" => "Tripped", "value" => $rbl });
				push (@{$feed->{'devices'}}, $feeds );				
			}
			#DevDoor	Door / window security sensor
			#DevFlood	Flood security sensor
			#DevCO2Alert	CO2 Alert sensor	
		} else {
			if ($f->{"Type"} eq "Energy") {
				#DevElectricity Electricity consumption sensor
				#Watts  Current consumption     Watt
				#ConsoTotal     Current total consumption       kWh
				#"Type" : "Energy", "SubType" : "CM180", "Usage" : "408 Watt", "Data" : "187.054 kWh"
				my ($usage)= ($f->{"Usage"} =~ /(\d+) Watt/);
				my ($total)= ($f->{"Data"} =~ /(\d+).\d+ kWh/);
				my $feeds={"id" => $f->{"idx"}, "name" => $name, "type" => "DevElectricity", "room" => "Utility", params =>[]};
				push (@{$feeds->{'params'}}, {"key" => "Watts", "value" =>$usage, "unit" => "W"} );
				 push (@{$feeds->{'params'}}, {"key" => "ConsoTotal", "value" =>$total, "unit" => "kWh"} );
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
			}

		}


	}; 
	#Get Scenes
	$system_url=config->{domo_path}."/json.htm?type=scenes";
	$json = $ua->get( $system_url );
	warn "Could not get $system_url!" unless defined $json;
	if ($json) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
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
	#Get Camera
	$system_url=config->{domo_path}."/json.htm?type=cameras";
debug($system_url);
	$json = $ua->get( $system_url );
	warn "Could not get $system_url!" unless defined $json;
	if ($json) {
		# Decode the entire JSON
		$decoded = JSON->new->utf8(0)->decode( $json->decoded_content );
		@results = @{ $decoded->{'result'} };
		foreach my $f ( @results ) {
				my $name=$f->{"Name"};
				$name=~s/\s/_/;
				$name=~s/\s/_/;
				$name=~s/\//_/;
				$name=~s/%/P/;
				my $feeds={"id" => $f->{"idx"}."_cam", "name" => $name, "type" => "DevCamera", "room" => "Switches", params =>[]};
				my $v=$f->{"ImageURL"};
				push (@{$feeds->{'params'}}, {"key" => "localjpegurl", "value" => "$v"} );
#				push (@{$feeds->{'params'}}, {"key" => "remotejpegurl", "value" => "$v"} );
				push (@{$feed->{'devices'}}, $feeds );
		}
	}
	#DevGenericSensor      Generic sensor (any value)
	#Value  Current value   N/A



	return($feed);
	return { success => true};
};

sub connect_usb {
	my $port=$_[0];
	Device::SerialPort->new($port, 1) || die "Can't open $port: $ +!"; 
	$ob = Device::SerialPort->new($port, 1) || die "Can't open $port: $ +!";
	$ob->databits(8);
	$ob->baudrate(115200);
	$ob->parity("none");
	$ob->stopbits(1);
	$ob->buffers( 4096, 4096 );
	$ob->write_settings();
	return $ob;
}

  sub connect_db {
    my $dbh = DBI->connect("dbi:SQLite:dbname=".setting('database')."?cache=shared", 
	    "",                          
	    "",                          
	    { RaiseError => 1 }
	) or die $DBI::errstr;

    return $dbh;
  }

  sub init_db {
    my $db = connect_db();
    my $schema = read_file('./schema.sql');
    $db->do($schema) or die $db->errstr;
  }

init_db();  
true;
