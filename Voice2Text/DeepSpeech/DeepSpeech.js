const deepSpeech = require('deepspeech');

let DEEPSPEECH_MODEL = __dirname + '/aiModels/deepspeech-0.9.3-models'; // path to deepspeech english model directory

class DeepSpeech {

	constructor() {
		this.modelStream;
		this.recordedChunks = 0;
		this.recordedAudioLength = 0;
		this.recordedVoiceLength = 0;
		this.silenceBuffers = [];
		this.englishModel = this.createModel(DEEPSPEECH_MODEL);
	}

	// Create AI model from files
	createModel(modelDir) {
		let modelPath = modelDir + '.pbmm';
		let scorerPath = modelDir + '.scorer';
		let model = new deepSpeech.Model(modelPath);
		model.enableExternalScorer(scorerPath);
		return model;
	}

	//Create new voice stream for the AI model
	createStream() {
		this.modelStream = this.englishModel.createStream();
		this.recordedAudioLength = 0;
	}


	// VAD has a tendency to cut the first bit of audio data from the start of a recording
	// so keep a buffer of that first bit of audio and in addBufferedSilence() reattach it to the beginning of the recording
	bufferSilence(data) {
		this.silenceBuffers.push(data);
		if (this.silenceBuffers.length >= 3) {
			this.silenceBuffers.shift();
		}
	}

	//Add silence (non VAD) data
	addBufferedSilence(data) {
		let audioBuffer;
		if (this.silenceBuffers.length) {
			this.silenceBuffers.push(data);
			let length = 0;
			this.silenceBuffers.forEach(function (buf) {
				length += buf.length;
			});
			audioBuffer = Buffer.concat(this.silenceBuffers, length);
			this.silenceBuffers = [];
		}
		else audioBuffer = data;
		return audioBuffer;
	}


	//Pass data to the AI model
	feedAudioContent(chunk, hasVoice) {
		if(hasVoice) this.recordedVoiceLength += (chunk.length / 2) * (1 / 16000) * 1000;
		this.recordedAudioLength += (chunk.length / 2) * (1 / 16000) * 1000;
		this.modelStream.feedAudioContent(chunk);
	}

	//Get results
	intermediateDecode() {
		let results = this.finishStream();
		this.createStream();
		return results;
	}


	//Finish stream with AI and get transcription
	finishStream() {
		if (this.modelStream) {
			let start = new Date();
			let text = this.modelStream.finishStream();
			if (text) {
				console.log('');
				console.log('Recognized Text:', text);
				let recogTime = new Date().getTime() - start.getTime();
				return {
					text,
					recogTime,
					audioLength: Math.round(this.recordedAudioLength)
				};
			}
		}
		this.silenceBuffers = [];
		this.modelStream = null;
	}
}

module.exports = DeepSpeech;
