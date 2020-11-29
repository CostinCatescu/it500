const request = require('request-promise-native').defaults({ simple: false, jar: true });
const cheerio = require('cheerio');
const config = require('./config').config;
const mqtt = require('./mqtt');
const log = require('./logger').log;

    
async function getTemperatures(token) {
    log('Get temperatures from raspberrypi.local:7777..', true);
    const responseDevice = await request.get(`http://raspberrypi.local:7777/api/fetchThermostatData?token=rtwert64526n543b73456jn7b45`);
    log('Zone temperature info received.', true);
    const deviceDetails = JSON.parse(responseDevice);
    return { zone1Temperature: deviceDetails.CH1currentRoomTemp, 
	     CH1heatOnOffStatus : deviceDetails.CH1heatOnOffStatus, 
	     CH1currentSetPoint: deviceDetails.CH1currentSetPoint
	    };
}

async function poll(){

    const temperatures = await getTemperatures();
    log(`MQTT publish zone 1: ${temperatures.zone1Temperature}ºc`, true);
    mqtt.publish(config.publishTopic, JSON.stringify({ 
        Zone1Temperature: parseFloat(temperatures.zone1Temperature),
	HeatingStatus: parseInt(temperatures.CH1heatOnOffStatus),
	CH1currentSetPoint: parseFloat(temperatures.CH1currentSetPoint), 
    }));
}

async function init() {
    log('it500 MQTT publish program starting.');
    mqtt.connect(config.mqttServer, config.mqttUsername, config.mqttPassword);
    setInterval(() => poll(), config.pollIntervalSeconds * 1000);
    log(`Timer set to publish every ${config.pollIntervalSeconds} seconds.`);
}

init();
