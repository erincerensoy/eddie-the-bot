
let fetch = require('node-fetch');
let Slack = require('@slack/client');  

let RtmClient = Slack.RtmClient;  
let RTM_EVENTS = Slack.RTM_EVENTS;

const token = process.env.API_TOKEN;
const iotUri = process.env.IOT_URI;

const INPUT_TYPES_COMMAND = 'COMMAND';
const INPUT_TYPES_DEVICEID = 'DEVICEID';
const INPUT_TYPES_DATA = 'DATA';
const INPUT_TYPES_COMPLETED = 'COMPLETED';

let rtm = new RtmClient(token, { logLevel: 'info' });  
rtm.start();

let iot_session = new Map();

rtm.on(RTM_EVENTS.MESSAGE, message => {
  console.log("request message:", message);  
  let inputText = message.text.toUpperCase();
  if(!inputText.startsWith("EDDIE")){
      return;
  }
	inputText = inputText.replace("EDDIE", "").trim();

  const channel = message.channel;
	const key = constructSessionKey(message);
  setSession(key);
  
	const responseMessage = getResponseMessage(inputText, key, channel);
	console.log("response  message is" + responseMessage);
  rtm.sendMessage(responseMessage, channel);
});

constructSessionKey = message => {
	const team = message.team;
  const channel = message.channel;
	const user = message.user;
	return team + "-" + channel + "-" + user;
}

setSession = key => {
	let session = iot_session.get(key);
	if(session === undefined){
		iot_session.set(key, {inputType:INPUT_TYPES_COMMAND});
	} 
}

getResponseMessage = (inputText, key, channel) => {
	const commands = ["LIST", "SEND"];
	const dataTypes = ["TVOC","TEMP", "HUMIDITY", "CO2", "PM25", "ACCMAXTILT","LIGHT", "NOISE"];
	
	let outputText;

  sessionData = iot_session.get(key);
	const inputType = sessionData.inputType;

  console.log("switching input type " + inputType);
	if(inputType === INPUT_TYPES_COMMAND){
		const command = inputText.split(" ")[0];
		switch(command){
				case "HELP":
					outputText = "abi command ler böyle:" + commands + " ne veriyim abime";
					break;
				case "LIST":  
					outputText = "hazırlanıyo abim";
					break;
				case "SEND":  
					outputText = "deviceId ne olsun abicim? eddie deviceId şeklinde yazman yeterli"
					sessionData.inputType = INPUT_TYPES_DEVICEID;
					break;
				default:
					outputText = "buyur abi, yardım lazımsa help yaz";
		}
	}

  if(inputType === INPUT_TYPES_DEVICEID){
		deviceId = inputText.split(" ")[0];
		if(!deviceId || deviceId < 1){
			outputText = "deviceId vermedin abicim, baştan alıyoruz. deviceId ne olsun abicim? eddie deviceId şeklinde yazman yeterli";
		}
		else{
			sessionData.inputType = INPUT_TYPES_DATA;
			sessionData.deviceId = deviceId;

			outputText = "deviceId olaraktan " + deviceId + " yi aldım. data gönder abim. Data örnekleri " + dataTypes + " örnek kullanım => eddie TEMP:23.5 HUMIDITY:10"
		}
	}



	if(inputType === INPUT_TYPES_DATA){
		dataList = inputText.split(" ")
		if(!dataList){
  		outputText = "data vermedin abicim, şöyle göndermelisin: Data örnekleri " + dataTypes + " örnek kullanım => eddie TEMP:23.5 HUMIDITY:10";
		}
		else{
		  const iotRequest = constructRequest(dataList);
			outputText = "cloud a şöyle request yapıyorum: " + JSON.stringify(iotRequest);
			fetchIotData(iotRequest).then(response => {
				outputText = "cloud dan cevap aynen şöyle:" + response;
				sessionData.inputType = INPUT_TYPES_COMMAND;
				rtm.sendMessage(outputText, channel);
			});
		}
	}

 	iot_session.set(key, sessionData);
	return outputText;
}

constructRequest = (dataList) => {
		let iotData = {};
			dataList.forEach(d => { 
				dataRecord = d.split(":")
				if(dataRecord.length === 2){
					const key = dataRecord[0];
					const value = dataRecord[1];
					iotData[key] = value;
				}
			});
			return {"deviceId": sessionData.deviceId, "data": iotData}
}

fetchIotData = (message) => {
    console.log("requesting " + iotUri + "with" + message);

    return fetch(iotUri,
        {
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(message)
        })
    .then(res => {
            return res.text();
        })
}

