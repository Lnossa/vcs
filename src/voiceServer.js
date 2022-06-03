const https = require('https');
const socketIO = require('socket.io');
const fs = require('fs');
const VAD = require('node-vad');

const DeepSpeech = require('./Voice2Text/DeepSpeech/DeepSpeech');
const GoogleS2T = require('./Voice2Text/Google/GoogleS2T');

//Setup
const SILENCE_THRESHOLD = 500; // how many milliseconds of inactivity before processing the audio
const SERVER_PORT = 4000; // websocket server port
const VAD_MODE = VAD.Mode.NORMAL;
const vad = new VAD(VAD_MODE);

//Globals
let recordedChunks = 0;
let silenceStart = null;
let endTimeout = null;
let language = null;

let v2t = null;

//************************************************************************************
//RUN VAD(voice activity detection), then pass the stream to the voice2text processor
//************************************************************************************


//Recording enabled by client
//Pass audio through voice activation detection (VAD)
function processAudioStream(data, callback) {
	vad.processAudio(data, 16000).then((res) => {
		switch (res) {
			case VAD.Event.ERROR:
				console.log("VAD ERROR");
				break;
			case VAD.Event.NOISE:
				console.log("VAD NOISE");
				break;
			case VAD.Event.SILENCE:
				processSilence(data, callback);
				break;
			case VAD.Event.VOICE:
				processVoice(data);
				break;
			default:
				console.log('default', res);
				
		}
	});
	
	// timeout after 1s of inactivity
	clearTimeout(endTimeout);
	endTimeout = setTimeout(function() {
		console.log('timeout');
	    resetAudioStream();
	},1000);
}


//Process VAD VOICE
function processVoice(data) {
	silenceStart = null;

	if (recordedChunks === 0) {
        //Uncomment ONLY one of these:
        v2t = new DeepSpeech();  //Uncomment for Mozilla DeepSpeech
        //v2t = new GoogleS2T(language); //Uncomment for Google Speech-To-Text    
        v2t.createStream();
        
		console.log('');
		process.stdout.write('[start]'); // recording started
	}
	else {
		process.stdout.write('='); // still recording
	}
	recordedChunks++;
	
	data = v2t.addBufferedSilence(data);
	v2t.feedAudioContent(data, true);
}


//Process VAD SILENCE
function processSilence(data, callback) {
	if (recordedChunks > 0) { // recording is on
		process.stdout.write('-'); // silence detected while recording
		
		v2t.feedAudioContent(data);
		
		if (silenceStart === null) {
			silenceStart = new Date().getTime();
		}
		else {
			let now = new Date().getTime();
			if (now - silenceStart > SILENCE_THRESHOLD) {
				silenceStart = null;
				console.log('[end]');
				let results = v2t.intermediateDecode(callback);
				if (results) {
					if (callback) {
						callback(results);
					}
				}
			}
		}
	}
	else {
		process.stdout.write('.'); // silence detected while not recording
		if(v2t)
			v2t.bufferSilence(data);
	}
}


// SILENCE_THRESHOLD elapsed
function endAudioStream(callback) {
	console.log('[end]');
	let results = v2t.intermediateDecode(callback);
	if (results) {
		if (callback) {
			callback(results);
		}
	}
    recordedChunks = 0;
}

// Recording disabled by client
function resetAudioStream() {
	clearTimeout(endTimeout);
	console.log('[reset]');
	v2t.intermediateDecode(() => {}); // ignore results
	recordedChunks = 0;
	silenceStart = null;
}


//***************************************************************************
//SET UP SERVER
//***************************************************************************


var serverOptions = {
    key: fs.readFileSync('../cert/client-key.pem'),
    cert: fs.readFileSync('../cert/client-cert.pem')
}


const app = https.createServer(serverOptions,function (req, res) {
	res.writeHead(200);
	res.write('web-microphone-websocket');
	res.end();
});

const io = socketIO(app, { 
    cors: {
      origin: "*"
    }
});

io.on('connection', function(socket) {
	console.log('client connected');
	
	socket.once('disconnect', () => {
		console.log('client disconnected');
	});
		
	socket.on('stream-data', function(data) {
		processAudioStream(data, (results) => {
			socket.emit('recognize', results);
		});
	});
	
	socket.on('stream-end', function() {
		endAudioStream((results) => {
			socket.emit('recognize', results);
		});
	});
	
	socket.on('stream-reset', function() {
		resetAudioStream();
	});


    socket.on('language', function (lang){
        language = lang;
        console.log("language: " + language);
    });
});

app.listen(SERVER_PORT, '0.0.0.0', () => {
	console.log('Socket server listening on:', SERVER_PORT);
});

module.exports = app;