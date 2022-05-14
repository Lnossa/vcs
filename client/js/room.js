requirejs(['/js/clientConfig.js', '/js/voiceClient.js'], function (config, voiceClient) {

    //Global variables
    var me = null;
    var room = null;
    var v2tClient = null;
    var inputMessage = document.getElementById("textSendMessage");
    var btnSendMessage = document.getElementById("btnSendMessage");
    var textAreaChat = document.getElementById("textAreaChat");
    var switchVoiceToText = document.getElementById("switchVoiceToText");

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    /**
     * This is the main function in this document: 
     * It gets the room token by using the room ID, it connects to the room 
     * using the newly aquired token and finally, it renders the participants
     * and sets up all the WebRTC features
     */
    fetch(config.host + '/getSingle?roomId=' + urlParams.get('roomId'))
        .then(response => { return response.json() })
        .then(async returnedRoom => {
            
            //Use the token to join the room
            room = await RealtimeSdk.joinRoom(returnedRoom.token, {
                audio: false,
                video: false,
                name: urlParams.get('userName'),
                participantInfo: {
                    language: urlParams.get('userLanguage')
                }
            });

            //We'll need this later, so save it in a 
            //global variable after joining the room
            me = room.localParticipant;


            //Setup voice to text
            var localMedia = me.mediaStream;
            v2tClient = new voiceClient(v2tCallback, config.v2tHost, localMedia);

            
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
            room.on('messageReceived', (participant, msg) => {

                //We have to copy it here, the methods are lost on send/recv :(
                if (msg) {
                    var rcvdMsg = new chatMessage(msg.sender, msg.text, msg.type, msg.language);
                    rcvdMsg.writeInChatBoxOnly();
                }
            });


            //Runs when you leave
            window.onbeforeunload = function () {
                if(room) 
                    room.leave();
            };
        });


    /**
     * Shows user card
     * @param {*} participant 
     */
    function render(participant) {

        var bHasVideo = participant.mediaStream ? participant.mediaStream.getVideoTracks().length > 0 : false;

        var targetDiv = document.getElementById('divOtherParticipants');

        if (participant.name == me.name &&
            participant.address == me.address) {
            targetDiv = document.getElementById('divMe');
        }

        const contDiv = document.createElement('div');
        contDiv.className = "col-lg-4";

        const cardDiv = document.createElement('div');
        cardDiv.id = 'video_' + participant.name + '_' + participant.address;
        cardDiv.className = 'card bg-light text-center';
        contDiv.appendChild(cardDiv);

        var videoDiv = null;
        

        if (bHasVideo) {

            videoDiv= document.createElement('div');
            participant.attach(videoDiv);        
        }
        else
        {
            videoDiv = document.createElement('img');2
            videoDiv.src = '/img/user.png'
            // videoDiv.width = "200";
            // videoDiv.height = "200";
        }
        videoDiv.className='card-img-top';
        cardDiv.appendChild(videoDiv); 


        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'card-body';
        cardDiv.appendChild(bodyDiv);

        const titleDiv = document.createElement('h5');
        titleDiv.className = 'card-title';
        if (participant.name == null) { participant.name = "noName" }
        titleDiv.innerHTML = participant.name + " [" + participant.participantInfo.language.toUpperCase() + "]";
        bodyDiv.appendChild(titleDiv);


        targetDiv.appendChild(contDiv);

        if(bHasVideo)
            participant.videoEl.style = "width:90%;margin:auto;margin-top:1em;border-radius:10px;";
        else
            videoDiv.style = 'height:200px;width:200px;margin:auto;'
    }




    //Send message when the send button is clicked
    btnSendMessage.addEventListener("click", async function () {
        const msg = new chatMessage(me.name, inputMessage.value);
        msg.send()
            .catch(e => console.log("Failed to send message: '" + e + "'"))
            .finally(() => { inputMessage.value = '' });
        //try { await room.sendMessageToParticipant(inputMessage.value); }
        //catch { console.log('No participant found to send message') }
        //finally { inputMessage.value = ''; }
    });

    //The message will also be sent on <Enter>
    inputMessage.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            btnSendMessage.click();
        }
    });

    //Start/stop the voice 2 text recording on flipping the switch
    switchVoiceToText.addEventListener("change", function () {
        if (switchVoiceToText.checked) {
            v2tClient.startRecording();
        }
        else {
            v2tClient.stopRecording();
        }
    });


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
                    break;
                }
                case 'sys': {
                    pDiv.className = 'text-warning';
                    break;
                }
            }


            pDiv.style = 'margin-bottom:0;'
            pDiv.innerHTML = this.sender + ": " + this.text;

            textAreaChat.appendChild(pDiv);
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
    $('#toggle-mic').click(function () {
        const muted = room.isMuted();
        $(this).find('i').toggleClass('bi-mic-mute-fill').toggleClass('bi-mic-fill');
    });

    $('#toggle-video').click(function () {
        try {
            document.querySelector('#localVideo').srcObject = room.localParticipant.mediaStream;
            const hasVideo = room.hasVideo();
            $(this).find('i').toggleClass('bi-camera-video-off-fill').toggleClass('bi-camera-video-fill');
        }
        catch (err) {
            console.log('User does not have a webcam available')
        }
    });

    $('#toggle-audio').click(async function () {
        const hasAudio = await room.toggleAudio();
        $(this).find('i').toggleClass('fa-volume-off').toggleClass('fa-volume-up');
    });

    $('#leave-button').click(function () {
        room.leave();
        window.open(config.host, "_self");
        $(this).find('i').toggleClass('fa-volume-off').toggleClass('fa-volume-up');
    });
});