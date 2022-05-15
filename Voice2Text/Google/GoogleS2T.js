const https = require('https');
const socketIO = require('socket.io');
const fs = require('fs');
const VAD = require('node-vad');




const stream = require('stream');

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');



let SILENCE_THRESHOLD = 500; // how many milliseconds of inactivity before processing the audio

const SERVER_PORT = 4000; // websocket server port

// const VAD_MODE = VAD.Mode.NORMAL;
//const VAD_MODE = VAD.Mode.LOW_BITRATE;
// const VAD_MODE = VAD.Mode.AGGRESSIVE;
const VAD_MODE = VAD.Mode.VERY_AGGRESSIVE;
const vad = new VAD(VAD_MODE);


let recordedChunks = 0;
let silenceStart = null;
let recordedAudioLength = 0;
let endTimeout = null;
let silenceBuffers = [];
let audioBuffer;



async function runTranscription(fileContents) {
	var apiCreds = fs.readFileSync('googleApiKey.json');

	// Creates a client
	const client = new speech.SpeechClient({ credentials: JSON.parse(apiCreds) });

	const encoding = 'LINEAR16';
	const sampleRateHertz = 16000;
	const languageCode = 'en-US';


	const request = {
		config: {
			encoding: encoding,
			sampleRateHertz: sampleRateHertz,
			languageCode: languageCode
		},
		interimResults: false, // If you want interim results, set this to true
	};


	// Create a recognize stream
	const recognizeStream = await client
		.streamingRecognize(request)
		.on('error', console.error)
		.on('data', data =>
			process.stdout.write(
				data.results[0] && data.results[0].alternatives[0]
					? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
					: '\n\nReached transcription time limit, press Ctrl+C\n'
			)
		);

	fileContents.pipe(recognizeStream);
	fileContents.end();
}


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
	endTimeout = setTimeout(function () {
		console.log('timeout');
		resetAudioStream();
	}, 1000);
}

function endAudioStream(callback) {
	console.log('[end]');
	let results = intermediateDecode();
	if (results) {
		if (callback) {
			callback(results);
		}
	}
}

function resetAudioStream() {
	clearTimeout(endTimeout);
	console.log('[reset]');
	intermediateDecode(); // ignore results
	recordedChunks = 0;
	silenceStart = null;
}

function processSilence(data, callback) {
	if (recordedChunks > 0) { // recording is on
		process.stdout.write('-'); // silence detected while recording

		feedAudioContent(data);

		if (silenceStart === null) {
			silenceStart = new Date().getTime();
		}
		else {
			let now = new Date().getTime();
			if (now - silenceStart > SILENCE_THRESHOLD) {
				silenceStart = null;
				console.log('[end]');
				let results = intermediateDecode();
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
		bufferSilence(data);
	}
}

function bufferSilence(data) {
	// VAD has a tendency to cut the first bit of audio data from the start of a recording
	// so keep a buffer of that first bit of audio and in addBufferedSilence() reattach it to the beginning of the recording
	silenceBuffers.push(data);
	if (silenceBuffers.length >= 3) {
		silenceBuffers.shift();
	}
}

function addBufferedSilence(data) {
	let buffer;
	if (silenceBuffers.length) {
		silenceBuffers.push(data);
		let length = 0;
		silenceBuffers.forEach(function (buf) {
			length += buf.length;
		});
		buffer = Buffer.concat(silenceBuffers, length);
		silenceBuffers = [];
	}
	else buffer = data;
	return buffer;
}

function processVoice(data) {
	silenceStart = null;
	if (recordedChunks === 0) {
		console.log('');
		process.stdout.write('[start]'); // recording started
	}
	else {
		process.stdout.write('='); // still recording
	}
	recordedChunks++;

	data = addBufferedSilence(data);
	feedAudioContent(data);
}

function createStream() {
	audioBuffer = new stream.PassThrough();
	silenceBuffers = [];
	recordedChunks = 0;
	recordedAudioLength = 0;
}

function finishStream() {
	console.log('Send here. Recorded: ' + recordedAudioLength);

	runTranscription(audioBuffer);

}

function intermediateDecode() {
	let results = finishStream();
	createStream();
	return results;
}

function feedAudioContent(chunk) {
	recordedAudioLength += (chunk.length / 2) * (1 / 16000) * 1000;
	audioBuffer.write(chunk);
}


var serverOptions = {
	key: fs.readFileSync('../../cert/client-key.pem'),
	cert: fs.readFileSync('../../cert/client-cert.pem')
}


const app = https.createServer(serverOptions, function (req, res) {
	res.writeHead(200);
	res.write('web-microphone-websocket');
	res.end();
});

const io = socketIO(app, {
	cors: {
		origin: "*"
	}
});

io.on('connection', function (socket) {
	console.log('client connected');

	socket.once('disconnect', () => {
		console.log('client disconnected');
	});

	createStream();

	socket.on('stream-data', function (data) {
		processAudioStream(data, (results) => {
			socket.emit('recognize', results);
		});
	});

	socket.on('stream-end', function () {
		endAudioStream((results) => {
			socket.emit('recognize', results);
		});
	});

	socket.on('stream-reset', function () {
		resetAudioStream();
	});
});

app.listen(SERVER_PORT, '0.0.0.0', () => {
	console.log('Socket server listening on:', SERVER_PORT);
});

module.exports = app;