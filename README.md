# 4Kronstadt VCS Implementation

### Getting started


##### Main application

 1. Install nodejs v15.14.0 - https://nodejs.org/download/release/v15.14.0/ 
    * Download the installer (msi) and make sure you select `Automatically install the necessary tools..` during the instalation process
 2. Get the code: `git clone https://github.com/Lnossa/vcs`  
 3. Get all the dependencies: `npm install`  
 4. Add your api key to `src/apiConfig.js` and change localhost to IP in `client/js/clientConfig.js`
 5. Start the application by running `node server.js`
 
##### Deepspeech

 1. If you haven't selected the 'Install necessary tols' options during the node installation process, you need to run the `install_tools.bat` script that can be found under `Program Files\nodejs\`
 1. Download A.I. models and place them under `/Voice2Text/DeepSpeech/aiModels`  
     * https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm
     * https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.scorer
 2. Run `npm install` again to get all the additional packages
 3. Launch the voice server by running `cd /Voice2Text/DeepSpeech` and `node DeepSpeech.js`

#### GeoLocation
1. Generate the api key. More info here: https://developers.google.com/maps/documentation/geolocation/get-api-key
2. Add the generated api-key in `/geo2-main/index.html`
3. Launch the voice server by running `cd /geo2-main` and `npm start`