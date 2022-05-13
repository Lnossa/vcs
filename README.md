# 4Kronstadt VCS Implementation

### Getting started


##### Main application

 1. Install nodejs v15.14.0 - https://nodejs.org/download/release/v15.14.0/  
 2. Get the code: `git clone https://github.com/Lnossa/vcs`  
 3. Get all the dependencies: `npm install`  
 4. Add your api key to `src/apiConfig.js` and change localhost to IP in `client/js/clientConfig.js`
 5. Start the application by running `node server.js`
 
##### Deepspeech

 1. Download A.I. models and place them under `/Voice2Speech/DeepSpeech/aiModels`  
     * https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm
     * https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.scorer
 2. Run `npm install` again to get all the additional packages
 3. Launch the voice server by running `cd /Voice2Speech/DeepSpeech` and `node DeepSpeech.js`
 4. Launch main application (see above)

