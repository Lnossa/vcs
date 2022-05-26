requirejs(['/js/clientConfig.js', '/js/voiceClient.js'], function (config, voiceClient) {

    //Global variables
    var me = null;
    var room = null;
    var v2tClient = null;
    var roomState = null;

    //Document elements
    var inputMessage = document.getElementById("textSendMessage");
    var btnSendMessage = document.getElementById("btnSendMessage");
    var textAreaChat = document.getElementById("textAreaChat");
    var switchVoiceToText = document.getElementById("switchVoiceToText");
    var switchVoiceToText_txt = document.getElementById("switchVoiceToText_txt");

    var btnMute = document.getElementById('toggle-mute');
    var btnVideo = document.getElementById('toggle-video');
    var btnAudio = document.getElementById('toggle-audio');
    var btnLeave = document.getElementById('leave-button');

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    /**
     * ======================================================================================
     * This is the main function in this document: 
     * It gets the room token by using the room ID, it connects to the room 
     * using the newly aquired token and finally, it renders the participants
     * and sets up all the WebRTC features
     * ======================================================================================
     */
    fetch(config.host + '/getSingle?roomId=' + urlParams.get('roomId'))
        .then(response => { return response.json() })
        .then(async returnedRoom => {

            try {
                //Use the token to join the room
                room = await RealtimeSdk.joinRoom(returnedRoom.token, {
                    audio: true,
                    video: false,
                    name: urlParams.get('userName'),
                    participantInfo: {
                        language: urlParams.get('userLanguage')
                    }
                });
            } catch (err) {
                console.log(err);
                alert(err);
                setTimeout(function () {
                    window.location.href = config.host;
                }, 500);
            }

            console.log("joined to " + room.name);
            document.title = room.name;

            //Update button states (mute/audio/video)
            updateButtons();

            //We'll need these later, so save them in  
            //global variables after joining the room
            me = room.localParticipant;

            //Render yourself + all the other participants
            render(room.localParticipant);
            room.remoteParticipants.forEach(render);


            //Runs when a participant joins
            room.on('participantJoined', async participant => {
                var msg = new chatMessage('[System]', participant.name + ' joined', 'sys');
                msg.writeInChatBoxOnly();

                render(participant);
            });

            //Runs when a participant leaves
            room.on('participantLeft', participant => {
                var msg = new chatMessage('[System]', participant.name + ' left', 'sys');
                msg.writeInChatBoxOnly();

                document.getElementById('video_' + participant.name + '_' + participant.address).remove();
            });

            //Runs when a message is received
            room.on('messageReceived', async (participant, msg) => {

                if (msg && msg.text) {
                    var bTranslate = false;
                    var message = msg.text;
                    //Translate?
                    if (participant.participantInfo.language != me.participantInfo.language) {
                        bTranslate = true;

                        await fetch('/translate?text=' + msg.text + '&from=' + participant.participantInfo.language + '&to=' + me.participantInfo.language)
                            .then(response => { return response.json() })
                            .then(function (res) {
                                message = res + '<br>&nbsp;(Original: ' + msg.text + ')';
                            });
                    }

                    //We have to copy it here, the methods are lost on send/recv :(
                    var rcvdMsg = new chatMessage(msg.sender, message, msg.type, msg.language);
                    rcvdMsg.writeInChatBoxOnly();
                }
            });

            //Runs when a remote stream is updated
            room.on('remoteStream', (participant, msg) => {
                render(participant);
            });

            //Runs when you leave
            window.onbeforeunload = function () {
                if (room)
                    room.leave();
            };
        });


    /**
     * Shows user card
     * @param {*} participant 
     * @description this creates a bootstrap card (https://getbootstrap.com/docs/4.0/components/card/)
     * and shows the user video and name inside it
     */
    function render(participant) {

        //Where will the participant be rendered?
        var targetDiv = document.getElementById('divOtherParticipants');
        if (participant.name == me.name &&
            participant.address == me.address) {
            targetDiv = document.getElementById('divMe');
        }

        //If the participant is already rendered remove it first
        const participantDivId = 'video_' + participant.name + '_' + participant.address;

        if (document.getElementById(participantDivId)) {
            document.getElementById(participantDivId).remove();
        }

        //Video ?
        var bHasVideo = participant.mediaStream ? participant.mediaStream.getVideoTracks().length > 0 : false;

        //Create a container div. This will have a unique ID - participantDivId
        const contDiv = document.createElement('div');
        contDiv.className = "col-lg-4";
        contDiv.id = participantDivId;

        //Create a card div inside the container.
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card bg-light text-center';
        contDiv.appendChild(cardDiv);

        //Create a video div inside the card div
        //This can be a normal div (for video), or an image (for static content - video off)
        var videoDiv = null;
        if (bHasVideo) {

            videoDiv = document.createElement('div');
        }
        else {
            videoDiv = document.createElement('img'); 2
            videoDiv.src = '/img/user.png'
        }
        participant.attach(videoDiv);
        videoDiv.className = 'card-img-top';
        cardDiv.appendChild(videoDiv);

        //Create a body div for the card
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'card-body';
        cardDiv.appendChild(bodyDiv);

        //Create a title div and place it inside the body
        const titleDiv = document.createElement('h5');
        titleDiv.className = 'card-title';
        if (participant.name == null) { participant.name = "noName" }
        titleDiv.innerHTML = participant.name + " [" + participant.participantInfo.language.toUpperCase() + "]";
        bodyDiv.appendChild(titleDiv);

        //Append everything to the target div
        targetDiv.appendChild(contDiv);


        //Final touches to make sure everything looks good
        if (bHasVideo)
            participant.videoEl.style = "width:90%;margin:auto;margin-top:1em;border-radius:10px;";
        else
            videoDiv.style = 'height:200px;width:200px;margin:auto;'
    }


    /**
     * ======================================================================================
     * This is where document (HTML) functionality is added. 
     * All button actions are implemented here 
     * ======================================================================================
     */


    //Send message when the send button is clicked
    btnSendMessage.addEventListener("click", async function () {
        const msg = new chatMessage(me.name, inputMessage.value);
        if (msg.text == '' || msg.text.trim() == '') {
            console.log('User try to send empty message...');
            inputMessage.value = '';
        }
        else {
            msg.send()
                .catch(e => console.log("Failed to send message: '" + e + "'"))
                .finally(() => { inputMessage.value = '' });
        }
    });

    //The message will also be sent on <Enter>
    inputMessage.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            btnSendMessage.click();
        }
    });

    //Start/stop the voice 2 text recording on flipping the switch
    switchVoiceToText.addEventListener("change", function () {
        if (room.hasAudio()) {
            if (switchVoiceToText.checked) {
                //Get local stream and setup voice to text
                v2tClient = new voiceClient(v2tCallback, config.v2tHost, room.localParticipant.mediaStream, me.participantInfo.language);
                v2tClient.startRecording();
                switchVoiceToText_txt.style.color = "blue";
            }
            else {
                if(v2tClient) {
                    v2tClient.stopRecording();
                    v2tClient.socketDisconnect();
                }
                switchVoiceToText_txt.style.color = "black";
            }
        }
        else {
            switchVoiceToText.checked = false;
        }
    });


    /**
     * Mute/Audio/Video buttons behaviour
     */

    btnMute.addEventListener("click", async function () {
        await room.toggleMute()
        updateButtons();
    });

    btnAudio.addEventListener("click", async function () {
        await room.toggleAudio().catch((e) => {
            console.log("Audio stream error: '" + e + "'");
        });
        updateButtons();
    });

    btnVideo.addEventListener("click", async function () {
        await room.toggleVideo()
            .then(function () {
                render(room.localParticipant);
            }).catch((e) => {
                console.log("Video stream error: '" + e + "'");
            });
        updateButtons();
    });

    btnLeave.addEventListener("click", async function () {
        room.leave();

        //room.leave() won't return anything, so we don't know when it's done with its processing
        //so I had to come up with this supid thing: 
        setTimeout(function () {
            window.location.href = config.host;
        }, 500);
    });

    //Change button graphics depending on room state
    function updateButtons() {
        if (room.isMuted()) {
            btnMute.firstElementChild.className = 'bi-mic-mute-fill text-danger';
            btnMute.title = 'Unmute audio';
        }
        else {
            btnMute.firstElementChild.className = 'bi-mic-fill text-info';
            btnMute.title = 'Mute audio';
        }

        if (room.hasAudio()) {
            btnAudio.firstElementChild.className = 'bi bi-volume-up-fill text-info';
            btnAudio.title = 'Disable audio';
            btnMute.disabled = false;

            switchVoiceToText.disabled = false;
            switchVoiceToText_txt.style.color = "black";
        }
        else {
            btnAudio.firstElementChild.className = 'bi bi-volume-mute-fill';
            btnAudio.title = 'Enable audio';
            btnMute.disabled = true;
            btnMute.firstElementChild.className = 'bi-mic-mute-fill';

            switchVoiceToText.checked = false;
            switchVoiceToText.disabled = true;
            if(v2tClient)
                v2tClient.stopRecording();
            switchVoiceToText_txt.style.color = "gray";
        }

        if (room.hasVideo()) {
            btnVideo.firstElementChild.className = 'bi-camera-video-fill text-info';
            btnVideo.title = 'Disable video';
        }
        else {
            btnVideo.firstElementChild.className = 'bi-camera-video-off-fill';
            btnVideo.title = 'Enable video';
        }
    }



    /**
    * ======================================================================================
    * Auxilliary stuff
    * ======================================================================================
    */


    /**
     * Callback function for voice to text. 
     * This function will be called every time there is a new v2t message
     * @param {string} msg 
     */
    async function v2tCallback(msg) {
        var msg = new chatMessage(me.name, msg, 'v2t');
        msg.send();
    }



    /**
     * Chat message class.
     * Used to send/receive messages and write them in the chatbox
     */
    class chatMessage {
        constructor(sender, text, type = 'msg', language = '') {
            this.sender = sender;
            this.text = text;
            this.type = type;
            this.language = language;
        }

        /**
         * Writes message in chat box. Does not send to others
         */
        writeInChatBoxOnly() {
            var pDiv = document.createElement('p');
            switch (this.type) {
                case 'msg': {
                    pDiv.className = 'text-secondary';
                    break;
                }
                case 'v2t': {
                    pDiv.className = 'text-info';
                    pDiv.innerHTML = '[Voice2Text] ';
                    break;
                }
                case 'sys': {
                    pDiv.className = 'text-warning';
                    break;
                }
            }


            pDiv.style = 'margin-bottom:0;'
            pDiv.innerHTML += this.sender + ": " + this.text;

            textAreaChat.appendChild(pDiv);
            textAreaChat.scrollTop= textAreaChat.scrollHeight;
        }

        /**
         * Sends the message out to the other participants.
         * Also writes it in the chatbox for the current participant
         */
        async send() {
            this.writeInChatBoxOnly();
            await room.sendMessageToParticipant(this);
        }
    }
});
