const fs = require('fs');
const stream = require('stream');

const speech = require('@google-cloud/speech');

const apiCreds = fs.readFileSync('Voice2Text/Google/googleApiKey.json');


class GoogleS2T {
	constructor(language = 'en-US') {
		this.recordedAudioLength = 0;
		this.recordedVoiceLength = 0;
		this.silenceBuffers = [];
		this.audioBuffer;
		this.language = language;
	}


	createStream() {
		this.audioBuffer = new stream.PassThrough();
		this.silenceBuffers = [];
		this.recordedAudioLength = 0;
		this.recordedVoiceLength = 0;
	}
	
	
	
	
	bufferSilence(data) {
		// VAD has a tendency to cut the first bit of audio data from the start of a recording
		// so keep a buffer of that first bit of audio and in addBufferedSilence() reattach it to the beginning of the recording
		this.silenceBuffers.push(data);
		if (this.silenceBuffers.length >= 3) {
			this.silenceBuffers.shift();
		}
	}
	

	addBufferedSilence(data) {
		let buffer;
		if (this.silenceBuffers.length) {
			this.silenceBuffers.push(data);
			let length = 0;
			this.silenceBuffers.forEach((buf) => {
				length += buf.length;
			});
			buffer = Buffer.concat(this.silenceBuffers, length);
			this.silenceBuffers = [];
		}
		else buffer = data;
		return buffer;
	}
	
	feedAudioContent(chunk, bHasVoice) {
		if(bHasVoice) this.recordedVoiceLength += (chunk.length / 2) * (1 / 16000) * 1000;
		this.recordedAudioLength += (chunk.length / 2) * (1 / 16000) * 1000;
		this.audioBuffer.write(chunk);
	}
	
	
	intermediateDecode(callback) {
		this.finishStream(callback);
		this.createStream();
	}
	
	finishStream(callback) {
		console.log('Send here. Recorded Total: ' + this.recordedAudioLength + ', Voice: ' + this.recordedVoiceLength);
	
		//only transcribe if voice recording is longer than 500 ms 
		if(this.recordedVoiceLength > 500)
			 this.runTranscription(this.audioBuffer, callback);
	}
	
	
	async runTranscription(buffer, callback) {
	
		var results = {
			text: ''
		} 

		// Creates a client
		const client = new speech.SpeechClient({ credentials: JSON.parse(apiCreds) });
	
		const encoding = 'LINEAR16';
		const sampleRateHertz = 16000;
		const languageCode = this.language;
	
	
		const request = {
			config: {
				encoding: encoding,
				sampleRateHertz: sampleRateHertz,
				languageCode: languageCode
			},
			interimResults: false, // If you want interim results, set this to true
		};
	

		// Create a recognize stream
		const recognizeStream = client
			.streamingRecognize(request)
			.on('error', console.error)
			.on('data', data => {
				results.text = data.results[0] && data.results[0].alternatives[0]
				? data.results[0].alternatives[0].transcript : '';
				console.log("Recognized (" + languageCode + "): " + results.text);
				callback(results);
			});

		buffer.pipe(recognizeStream);
		buffer.end();
	}
}

module.exports = GoogleS2T;