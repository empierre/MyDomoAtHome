CREATE TABLE if not exists device (
		id INT PRIMARY KEY AUTOINCREMENT,
		I_BATTERY_LEVEL	REAL,
		I_RELAY_NODE	INT,
		S_ARDUINO_NODE	TEXT,
		S_ARDUINO_RELAY	TEXT,
		I_SKETCH_NAME	TEXT,
		I_SKETCH_VERSION REAL,
		I_UNIT			TEXT);
CREATE TABLE if not exists sensor (
		id INT PRIMARY KEY AUTOINCREMENT,
		device_id INT not null,
	    subtype  REAL,
	    version  REAL);		
CREATE TABLE if not exists value (
		id INT PRIMARY KEY AUTOINCREMENT,
		sensor_id INT not null,
		value_type INT not null,
	    	value TEXT,
	    	lastupdate    DATE);
