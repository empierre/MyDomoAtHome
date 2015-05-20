package RFXNames;

#based on SDK version 8.03A

use constant {
	pTypeRecXmitMessage => 0x02
	sTypeReceiverLockError => 0x00
	sTypeTransmitterResponse => 0x01

	#undecoded => types
	pTypeUndecoded => 0x03
	sTypeUac => 0x00
	sTypeUarc => 0x01
	sTypeUati => 0x02
	sTypeUhideki => 0x03
	sTypeUlacrosse => 0x04
	sTypeUad => 0x05
	sTypeUmertik => 0x06
	sTypeUoregon1 => 0x07
	sTypeUoregon2 => 0x08
	sTypeUoregon3 => 0x09
	sTypeUproguard => 0x0A
	sTypeUvisonic => 0x0B
	sTypeUnec => 0x0C
	sTypeUfs20 => 0x0D
	sTypeUrsl => 0x0E
	sTypeUblinds => 0x0F
	sTypeUrubicson => 0x10
	sTypeUae => 0x11
	sTypeUfineoffset => 0x12
	sTypeUrgb => 0x13
	sTypeUrfy => 0x14
	sTypeUselectplus => 0x15

	#types => for => Lighting
	pTypeLighting1 => 0x10
	sTypeX10 => 0x0
	sTypeARC => 0x1
	sTypeAB400D => 0x2
	sTypeWaveman => 0x3
	sTypeEMW200 => 0x4
	sTypeIMPULS => 0x5
	sTypeRisingSun => 0x6
	sTypePhilips => 0x7
	sTypeEnergenie => 0x8
	sTypeEnergenie5 => 0x9
	sTypeGDR2 => 0x0A

	light1_sOff => 0x0
	light1_sOn => 0x1
	light1_sDim => 0x2
	light1_sBright => 0x3
	light1_sAllOff => 0x5
	light1_sAllOn => 0x6
	light1_sChime => 0x7

	pTypeLighting2 => 0x11
	sTypeAC => 0x0
	sTypeHEU => 0x1
	sTypeANSLUT => 0x2
	sTypeKambrook => 0x03

	light2_sOff => 0x0
	light2_sOn => 0x1
	light2_sSetLevel => 0x2
	light2_sGroupOff => 0x3
	light2_sGroupOn => 0x4
	light2_sSetGroupLevel => 0x5

	pTypeLighting3 => 0x12
	sTypeKoppla => 0x0
	light3_sBright => 0x0
	light3_sDim => 0x8
	light3_sOn => 0x10
	light3_sLevel1 => 0x11
	light3_sLevel2 => 0x12
	light3_sLevel3 => 0x13
	light3_sLevel4 => 0x14
	light3_sLevel5 => 0x15
	light3_sLevel6 => 0x16
	light3_sLevel7 => 0x17
	light3_sLevel8 => 0x18
	light3_sLevel9 => 0x19
	light3_sOff => 0x1A
	light3_sProgram => 0x1B

	pTypeLighting4 => 0x13
	sTypePT2262 => 0x0

	pTypeLighting5 => 0x14
	sTypeLightwaveRF => 0x0
	sTypeEMW100 => 0x1
	sTypeBBSB => 0x2
	sTypeMDREMOTE => 0x03
	sTypeRSL => 0x04
	sTypeLivolo => 0x05
	sTypeTRC02 => 0x06
	sTypeAoke => 0x07
	sTypeTRC02_2 => 0x08
	sTypeEurodomest => 0x09
	sTypeLivoloAppliance => 0x0A

	light5_sOff => 0x0
	light5_sOn => 0x1
	light5_sGroupOff => 0x2
	light5_sLearn => 0x2
	light5_sGroupOn => 0x3
	light5_sMood1 => 0x3
	light5_sMood2 => 0x4
	light5_sMood3 => 0x5
	light5_sMood4 => 0x6
	light5_sMood5 => 0x7
	light5_sUnlock => 0xA
	light5_sLock => 0xB
	light5_sAllLock => 0xC
	light5_sClose => 0xD
	light5_sStop => 0xE
	light5_sOpen => 0xF
	light5_sSetLevel => 0x10
	light5_sColourPalette => 0x11
	light5_sColourTone => 0x12
	light5_sColourCycle => 0x13
	light5_sPower => 0x0
	light5_sLight => 0x1
	light5_sBright => 0x2
	light5_sDim => 0x3
	light5_s100 => 0x4
	light5_s50 => 0x5
	light5_s25 => 0x6
	light5_sModePlus => 0x7
	light5_sSpeedMin => 0x8
	light5_sSpeedPlus => 0x9
	light5_sModeMin => 0xA
	light5_sLivoloAllOff => 0x00
	light5_sLivoloGang1Toggle => 0x01
	light5_sLivoloGang2Toggle => 0x02	#dim+ => for => dimmer
	light5_sLivoloGang3Toggle => 0x03	#dim- => for => dimmer
	light5_sLivoloGang4Toggle => 0x04
	light5_sLivoloGang5Toggle => 0x05
	light5_sLivoloGang6Toggle => 0x06
	light5_sLivoloGang7Toggle => 0x07
	light5_sLivoloGang8Toggle => 0x08
	light5_sLivoloGang9Toggle => 0x09
	light5_sLivoloGang10Toggle => 0x0A
	light5_sRGBoff => 0x00
	light5_sRGBon => 0x01
	light5_sRGBbright => 0x02
	light5_sRGBdim => 0x03
	light5_sRGBcolorplus => 0x04
	light5_sRGBcolormin => 0x05

	pTypeLighting6 => 0x15
	sTypeBlyss => 0x0
	light6_sOn => 0x0
	light6_sOff => 0x1
	light6_sGroupOn => 0x2
	light6_sGroupOff => 0x3

	pTypeChime => 0x16
	sTypeByronSX => 0x0
	sTypeByronMP001 => 0x1
	sTypeSelectPlus => 0x2
	sTypeSelectPlus3 => 0x3
	sTypeEnvivo => 0x4
	chime_sound0 => 0x1
	chime_sound1 => 0x3
	chime_sound2 => 0x5
	chime_sound3 => 0x9
	chime_sound4 => 0xD
	chime_sound5 => 0xE
	chime_sound6 => 0x6
	chime_sound7 => 0x2

	pTypeFan => 0x17
	sTypeSiemensSF01 => 0x0
	fan_sTimer => 0x1
	fan_sMin => 0x2
	fan_sLearn => 0x3
	fan_sPlus => 0x4
	fan_sConfirm => 0x5
	fan_sLight => 0x6

	#types => for => Curtain
	pTypeCurtain => 0x18
	sTypeHarrison => 0x0
	curtain_sOpen => 0x0
	curtain_sClose => 0x1
	curtain_sStop => 0x2
	curtain_sProgram => 0x3

	#types => for => Blinds
	pTypeBlinds => 0x19
	sTypeBlindsT0 => 0x0	#RollerTrol, => Hasta => new
	sTypeBlindsT1 => 0x1	#Hasta => old
	sTypeBlindsT2 => 0x2	#A-OK => RF01
	sTypeBlindsT3 => 0x3	#A-OK => AC114
	sTypeBlindsT4 => 0x4	#RAEX => YR1326
	sTypeBlindsT5 => 0x5	#Media => Mount
	sTypeBlindsT6 => 0x6	#DC106, => YOOHA, => Rohrmotor24 => RMF
	sTypeBlindsT7 => 0x7	#Forest
	sTypeBlindsT8 => 0x8	#Chamberlain => CS4330CN
	sTypeBlindsT9 => 0x9	#Sunpery
	sTypeBlindsT10 => 0xA	#Dolat => DLM-1

	blinds_sOpen => 0x0
	blinds_sClose => 0x1
	blinds_sStop => 0x2
	blinds_sConfirm => 0x3
	blinds_sLimit => 0x4
	blinds_slowerLimit => 0x5
	blinds_sDeleteLimits => 0x6
	blinds_sChangeDirection => 0x7
	blinds_sLeft => 0x8
	blinds_sRight => 0x9
	blinds_s9ChangeDirection => 0x6
	blinds_s9ImA => = => 0x7
	blinds_s9ImCenter => = => 0x8
	blinds_s9ImB => = => 0x9
	blinds_s9EraseCurrentCh => = => 0xA
	blinds_s9EraseAllCh => = => 0xB
	blinds_s10LearnMaster => = => 0x4
	blinds_s10EraseCurrentCh => = => 0x5
	blinds_s10ChangeDirection => = => 0x6

	#types => for => RFY
	pTypeRFY => 0x1A
	sTypeRFY => 0x0	#RFY
	sTypeRFYext => 0x1	#RFY => extended
	rfy_sStop => 0x0
	rfy_sUp => 0x1
	rfy_sUpStop => 0x2
	rfy_sDown => 0x3
	rfy_sDownStop => 0x4
	rfy_sUpDown => 0x5
	rfy_sListRemotes => 0x6
	rfy_sProgram => 0x7
	rfy_s2SecProgram => 0x8
	rfy_s7SecProgram => 0x9
	rfy_s2SecStop => 0xA
	rfy_s5SecStop => 0xB
	rfy_s5SecUpDown => 0xC
	rfy_sEraseThis => 0xD
	rfy_sEraseAll => 0xE
	rfy_s05SecUp => 0xF
	rfy_s05SecDown => 0x10
	rfy_s2SecUp => 0x11
	rfy_s2SecDown => 0x12
	rfy_sEnableSunWind => 0x13
	rfy_sDisableSun => 0x14

	#types => for => Security1
	pTypeSecurity1 => 0x20
	sTypeSecX10 => 0x0				#X10 => security
	sTypeSecX10M => 0x1			#X10 => security => motion
	sTypeSecX10R => 0x2			#X10 => security => remote
	sTypeKD101 => 0x3				#KD101 => smoke => detector
	sTypePowercodeSensor => 0x04	#Visonic => PowerCode => sensor => - => primary => contact
	sTypePowercodeMotion => 0x05	#Visonic => PowerCode => motion
	sTypeCodesecure => 0x06		#Visonic => CodeSecure
	sTypePowercodeAux => 0x07		#Visonic => PowerCode => sensor => - => auxiliary => contact
	sTypeMeiantech => 0x8			#Meiantech
	sTypeSA30 => 0x9				#SA30 => smoke => detector

	#status => security
	sStatusNormal => 0x0
	sStatusNormalDelayed => 0x1
	sStatusAlarm => 0x2
	sStatusAlarmDelayed => 0x3
	sStatusMotion => 0x4
	sStatusNoMotion => 0x5
	sStatusPanic => 0x6
	sStatusPanicOff => 0x7
	sStatusIRbeam => 0x8
	sStatusArmAway => 0x9
	sStatusArmAwayDelayed => 0xA
	sStatusArmHome => 0xB
	sStatusArmHomeDelayed => 0xC
	sStatusDisarm => 0xD
	sStatusLightOff => 0x10
	sStatusLightOn => 0x11
	sStatusLight2Off => 0x12
	sStatusLight2On => 0x13
	sStatusDark => 0x14
	sStatusLight => 0x15
	sStatusBatLow => 0x16
	sStatusPairKD101 => 0x17
	sStatusNormalTamper => 0x80
	sStatusNormalDelayedTamper => 0x81
	sStatusAlarmTamper => 0x82
	sStatusAlarmDelayedTamper => 0x83
	sStatusMotionTamper => 0x84
	sStatusNoMotionTamper => 0x85

	#types => for => Security2
	pTypeSecurity2 => 0x21
	sTypeSec2Classic => 0x0

	#types => for => Camera
	pTypeCamera => 0x28
	sTypeNinja => 0x0		#X10 => Ninja/Robocam
	camera_sLeft => 0x0
	camera_sRight => 0x1
	camera_sUp => 0x2
	camera_sDown => 0x3
	camera_sPosition1 => 0x4
	camera_sProgramPosition1 => 0x5
	camera_sPosition2 => 0x6
	camera_sProgramPosition2 => 0x7
	camera_sPosition3 => 8
	camera_sProgramPosition3 => 0x9
	camera_sPosition4 => 0xA
	camera_sProgramPosition4 => 0xB
	camera_sCenter => 0xC
	camera_sProgramCenterPosition => 0xD
	camera_sSweep => 0xE
	camera_sProgramSweep => 0xF

	#types => for => Remotes
	pTypeRemote => 0x30
	sTypeATI => 0x0		#ATI => Remote => Wonder
	sTypeATIplus => 0x1	#ATI => Remote => Wonder => Plus
	sTypeMedion => 0x2		#Medion => Remote
	sTypePCremote => 0x3	#PC => Remote
	sTypeATIrw2 => 0x4		#ATI => Remote => Wonder => II

	#types => for => Thermostat
	pTypeThermostat1 => 0x40
	sTypeDigimax => 0x0		#Digimax
	sTypeDigimaxShort => 0x1	#Digimax => with => short => format
	thermostat1_sNoStatus => 0x0
	thermostat1_sDemand => 0x1
	thermostat1_sNoDemand => 0x2
	thermostat1_sInitializing => 0x3

	pTypeThermostat2 => 0x41
	sTypeHE105 => 0x0
	sTypeRTS10 => 0x1
	thermostat2_sOff => 0x0
	thermostat2_sOn => 0x1
	thermostat2_sProgram => 0x2

	pTypeThermostat3 => 0x42
	sTypeMertikG6RH4T1 => 0x0	#Mertik => G6R-H4T1
	sTypeMertikG6RH4TB => 0x1	#Mertik => G6R-H4TB
	sTypeMertikG6RH4TD => 0x2	#Mertik => G6R-H4TD
	sTypeMertikG6RH4S => 0x3	#Mertik => G6R-H4S
	thermostat3_sOff => 0x0
	thermostat3_sOn => 0x1
	thermostat3_sUp => 0x2
	thermostat3_sDown => 0x3
	thermostat3_sRunUp => 0x4
	thermostat3_Off2nd => 0x4
	thermostat3_sRunDown => 0x5
	thermostat3_On2nd => 0x5
	thermostat3_sStop => 0x6

	#types => for => Radiator => valve
	pTypeRadiator1 => 0x48
	sTypeSmartwares => 0x0	#Homewizard => smartwares

	Radiator1_sNight => 0x0
	Radiator1_sDay => 0x1
	Radiator1_sSetTemp => 0x2

	#types => for => BBQ => temperature
	pTypeBBQ => 0x4E
	sTypeBBQ1 => 0x1 =>  => #Maverick => ET-732

	#types => for => temperature+rain
	pTypeTEMP_RAIN => 0x4F
	sTypeTR1 => 0x1 =>  => #WS1200

	#types => for => temperature
	pTypeTEMP => 0x50
	sTypeTEMP1 => 0x1 =>  => #THR128/138,THC138
	sTypeTEMP2 => 0x2 =>  => #THC238/268,THN132,THWR288,THRN122,THN122,AW129/131
	sTypeTEMP3 => 0x3 =>  => #THWR800
	sTypeTEMP4 => 0x4	#RTHN318
	sTypeTEMP5 => 0x5 =>  => #LaCrosse => TX3
	sTypeTEMP6 => 0x6 =>  => #TS15C
	sTypeTEMP7 => 0x7 =>  => #Viking => 02811,TSS330
	sTypeTEMP8 => 0x8 =>  => #LaCrosse => WS2300
	sTypeTEMP9 => 0x9 =>  => #RUBiCSON
	sTypeTEMP10 => 0xA =>  => #TFA => 30.3133
	sTypeTEMP11 => 0xB =>  => #WT0122

	#types => for => humidity
	pTypeHUM => 0x51
	sTypeHUM1 => 0x1 =>  => #LaCrosse => TX3
	sTypeHUM2 => 0x2 =>  => #LaCrosse => WS2300

	#status => types => for => humidity
	humstat_normal => 0x0
	humstat_comfort => 0x1
	humstat_dry => 0x2
	humstat_wet => 0x3

	#types => for => temperature+humidity
	pTypeTEMP_HUM => 0x52
	sTypeTH1 => 0x1 =>  => #THGN122/123,THGN132,THGR122/228/238/268
	sTypeTH2 => 0x2 =>  => #THGR810,THGN800
	sTypeTH3 => 0x3 =>  => #RTGR328
	sTypeTH4 => 0x4 =>  => #THGR328
	sTypeTH5 => 0x5 =>  => #WTGR800
	sTypeTH6 => 0x6 =>  => #THGR918,THGRN228,THGN500
	sTypeTH7 => 0x7 =>  => #TFA => TS34C, => Cresta
	sTypeTH8 => 0x8 =>  => #WT450H
	sTypeTH9 => 0x9 =>  => #Viking => 02035,02038 => (02035 => has => no => humidity), => TSS320
	sTypeTH10 => 0xA =>  =>  => #Rubicson
	sTypeTH11 => 0xB =>  =>  => #EW109
	sTypeTH12 => 0xC =>  =>  => #Imagintronix
	sTypeTH13 => 0xD =>  =>  => #Alecto => WS1700 => and => compatibles
	sTypeTH14 => 0xE =>  =>  => #Alecto

	#types => for => barometric
	pTypeBARO => 0x53

	#types => for => temperature+humidity+baro
	pTypeTEMP_HUM_BARO => 0x54
	sTypeTHB1 => 0x1 =>  =>  => #BTHR918,BTHGN129
	sTypeTHB2 => 0x2 =>  =>  => #BTHR918N,BTHR968
	baroForecastNoInfo => 0x00
	baroForecastSunny => 0x01
	baroForecastPartlyCloudy => 0x02
	baroForecastCloudy => 0x03
	baroForecastRain => 0x04

	#types => for => rain
	pTypeRAIN => 0x55
	sTypeRAIN1 => 0x1 =>  =>  => #RGR126/682/918
	sTypeRAIN2 => 0x2 =>  =>  => #PCR800
	sTypeRAIN3 => 0x3 =>  =>  => #TFA
	sTypeRAIN4 => 0x4 =>  =>  => #UPM
	sTypeRAIN5 => 0x5 =>  =>  => #WS2300
	sTypeRAIN6 => 0x6 =>  =>  => #TX5
	sTypeRAIN7 => 0x7 =>  =>  => #Alecto

	#types => for => wind
	pTypeWIND => 0x56
	sTypeWIND1 => 0x1 =>  =>  => #WTGR800
	sTypeWIND2 => 0x2 =>  =>  => #WGR800
	sTypeWIND3 => 0x3 =>  =>  => #STR918,WGR918
	sTypeWIND4 => 0x4 =>  =>  => #TFA
	sTypeWIND5 => 0x5 =>  =>  => #UPM
	sTypeWIND6 => 0x6 =>  =>  => #WS2300
	sTypeWIND7 => 0x7 =>  =>  => #Alecto => WS4500

	#types => for => uv
	pTypeUV => 0x57
	sTypeUV1 => 0x1 =>  =>  => #UVN128,UV138
	sTypeUV2 => 0x2 =>  =>  => #UVN800
	sTypeUV3 => 0x3 =>  =>  => #TFA

	#types => for => date => & => time
	pTypeDT => 0x58
	sTypeDT1 => 0x1 =>  =>  => #RTGR328N

	#types => for => current
	pTypeCURRENT => 0x59
	sTypeELEC1 => 0x1 =>  =>  => #CM113,Electrisave

	#types => for => energy
	pTypeENERGY => 0x5A
	sTypeELEC2 => 0x1 =>  =>  => #CM119/160
	sTypeELEC3 => 0x2 =>  =>  => #CM180

	#types => for => current-energy
	pTypeCURRENTENERGY => 0x5B
	sTypeELEC4 => 0x1 =>  =>  => #CM180i

	#types => for => power
	pTypePOWER => 0x5C
	sTypeELEC5 => 0x1 =>  =>  => #revolt

	#types => for => weight => scales
	pTypeWEIGHT => 0x5D
	sTypeWEIGHT1 => 0x1 =>  =>  => #BWR102
	sTypeWEIGHT2 => 0x2 =>  =>  => #GR101

	#types => for => gas
	pTypeGAS => 0x5E

	#types => for => water
	pTypeWATER => 0x5F

	#RFXSensor
	pTypeRFXSensor => 0x70
	sTypeRFXSensorTemp => 0x0
	sTypeRFXSensorAD => 0x1
	sTypeRFXSensorVolt => 0x2
	sTypeRFXSensorMessage => 0x3

	#RFXMeter
	pTypeRFXMeter => 0x71
	sTypeRFXMeterCount => 0x0
	sTypeRFXMeterInterval => 0x1
	sTypeRFXMeterCalib => 0x2
	sTypeRFXMeterAddr => 0x3
	sTypeRFXMeterCounterReset => 0x4
	sTypeRFXMeterCounterSet => 0xB
	sTypeRFXMeterSetInterval => 0xC
	sTypeRFXMeterSetCalib => 0xD
	sTypeRFXMeterSetAddr => 0xE
	sTypeRFXMeterIdent => 0xF

	#FS20
	pTypeFS20 => 0x72
	sTypeFS20 => 0x0
	sTypeFHT8V => 0x1
	sTypeFHT80 => 0x2
};

true;
