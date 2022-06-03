# 4Kronstadt VCS Implementation

## Installation


### Main application

 1. Install nodejs v15.14.0 - https://nodejs.org/download/release/v15.14.0/ 
    * Download the installer **(.msi)** and make sure you select all available options in the *"Custom setup"* step. Click next, and check the box for *"Automatically install the necessary tools.."*
 2. Get the code: `git clone https://github.com/Lnossa/vcs`  
 3. Get all the dependencies: `npm install` - make sure you are in the vcs folder
 4. Add your api key to `src/apiConfig.js` and change localhost to your your IP in `client/js/clientConfig.js`
 5. Start the application by running `node server.js`
 

### Google Translate (Optional)

 1. Activate the service for your account and follow the instructions [here](https://cloud.google.com/docs/authentication/api-keys#creating_an_api_key) to generate your API key
 2. Download the key and save it under `src/GoogleTranslate/` as 'googleApiKey.json'


### Voice Server

Pick one of the 2 APIs below (default is Deepspeech):

#### 1. Deepspeech

 1. If you haven't selected the 'Install necessary tols' options during the node installation process, you need to run the `install_tools.bat` script that can be found under `Program Files\nodejs\`
 2. Download A.I. models and place them under `src/Voice2Text/DeepSpeech/aiModels/`  
     * https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm
     * https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.scorer
 3. Run `npm install` again to get all the additional packages
 4. Activate Deepspeech inside voiceServer.js (TODO: implement a proper way to do this) 
 5. Launch the voice server by running `cd /src` and `node voiceServer.js`


#### 2. Google Speech-To-Text (Optional)

 1. Activate the service for your account and follow the instructions [here](https://cloud.google.com/docs/authentication/api-keys#creating_an_api_key) to generate your API key
 2. Download the key and save it under `src/Voice2Text/Google/` as 'googleApiKey.json'
 3. Run `npm install` again to get all the additional packages
 4. Launch the voice server by running `cd /src` and `node voiceServer.js`

---

## Launching the app

 1. Start the main app by running node server.js
 2. Start the voice server by running `cd /src` and `node voiceServer.js`
 3. Access the app at https://<ip in client/js/clientConfig.js>:8000
 4. Make sure you also access the voice server (in your browser, on port 4000) at least once, to accept the self signed certificate!