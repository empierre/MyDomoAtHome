#!/bin/sh
cd ~/domoticz
sudo apt-get -y install sqlite3
sqlite3 domoticz.db << EOF
CREATE INDEX IX_MM_ID_DATE ON MultiMeter(DeviceRowID, Date);
CREATE INDEX IX_M_ID_DATE ON Meter(DeviceRowID, Date);
CREATE INDEX IX_Temp_ID_DATE ON Temperature(DeviceRowID, Date);
CREATE INDEX IX_Rain_ID_DATE ON Rain(DeviceRowID, Date);
CREATE INDEX IX_Wind_ID_DATE ON Wind(DeviceRowID, Date);
CREATE INDEX IX_LightingLog_ID_DATE ON LightingLog(DeviceRowID, Date);
CREATE INDEX IX_Percentage_ID_DATE ON Percentage(DeviceRowID, Date);
CREATE INDEX IX_CAL_MM_ID_DATE ON MultiMeter_Calendar(DeviceRowID, Date);
CREATE INDEX IX_CAL_M_ID_DATE ON Meter_Calendar(DeviceRowID, Date);
CREATE INDEX IX_CAL_Temp_ID_DATE ON Temperature_Calendar(DeviceRowID, Date);
CREATE INDEX IX_CAL_Rain_ID_DATE ON Rain_Calendar(DeviceRowID, Date);
CREATE INDEX IX_CAL_Wind_ID_DATE ON Wind_Calendar(DeviceRowID, Date);
CREATE INDEX IX_CAL_Percentage_ID_DATE ON Percentage_Calendar(DeviceRowID, Date);
.exit
EOF

