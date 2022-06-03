const fs = require('fs');
const { TranslationServiceClient } = require('@google-cloud/translate');

module.exports = {


    /**
     * 
     * @param {string} text 
     * @param {string} to 
     * @param {string} from 
     * @returns 
     */
    translateText: async function (text, from, to) {

        var output = text + "[Not Translated]";

        //You will need to generate your own key file, download it and place the path here.
        const keyPath = 'src/GoogleTranslate/googleApiKey.json'; 
        const projectId = 'voicerecognition-349810';
        const location = 'global';

        if (fs.existsSync(keyPath)) {
            // Instantiates a client
            const translationClient = new TranslationServiceClient({
                projectId: projectId,
                keyFilename: keyPath
            });

            if (!translationClient) {
                console.log('Could not initiate Google Translate API client. Check network connection and api key!')
                return output;
            }

                // Construct request
                const request = {
                    parent: `projects/${projectId}/locations/${location}`,
                    contents: [text],
                    mimeType: 'text/plain',
                    sourceLanguageCode: from,
                    targetLanguageCode: to,
                };

                // Run request
                await translationClient.translateText(request).then((response) => {
                    if (response && response.length > 1 &&
                        response[0].translations && response[0].translations.length > 0) {
                        output = response[0].translations[0].translatedText;
                    }
                    else {
                        console.log('Possible error in translateText. Response: ');
                        console.log(response);

                    }
                }).catch((e) => {
                    console.log(e);
                });
        }
        else
        {
            console.log('File ' + keyPath + ' not found.\n');
            
        }
        return output;
    }
};

