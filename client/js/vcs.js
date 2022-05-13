requirejs(['/js/clientConfig.js', '/js/voiceClient.js'], function(config, voiceClient) {


    var me = null;
    var room = null;
    var v2tClient = null;
    var inputMessage = document.getElementById("textSendMessage");
    var btnSendMessage = document.getElementById("btnSendMessage");
    var textAreaChat = document.getElementById("textAreaChat");
    var switchVoiceToText = document.getElementById("switchVoiceToText");


    class chatMessage {
        constructor(sender, text, type='msg', language='') {
            this.sender = sender;
            this.text = text;
            this.type = type;
            this.language = language;
        }

        writeInChatBox() {
            var pDiv = document.createElement('p');
            switch(this.type)
            {
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

        async sendToOthers() {
            await room.sendMessageToParticipant(this);
        }
    }


    btnSendMessage.addEventListener("click", async function() {
        const msg = new chatMessage(me.name, inputMessage.value);
        msg.writeInChatBox();
        msg.sendToOthers()
            .catch( e => console.log("Failed to send message: '" + e + "'")) //log error
            .finally(() => {inputMessage.value = ''}); //clear text input no matter what
    }); 

    //The message will also be sent on <Enter>
    inputMessage.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            btnSendMessage.click();
        }
    }); 

    switchVoiceToText.addEventListener("change", function() {
        if(switchVoiceToText.checked)
        {
            v2tClient.startRecording();
        }
        else {
            v2tClient.stopRecording();
        }
    })

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);



    async function v2tCallback(msg) {
        var msg = new chatMessage(me.name, msg, 'v2t');
        msg.writeInChatBox();
        msg.sendToOthers();
    }

    fetch(config.host + '/getSingle?roomId=' + urlParams.get('roomId'))
        .then(response => {return response.json()})
        .then(async returnedRoom => {
            token = returnedRoom.token;

            room = await RealtimeSdk.joinRoom(token, {
                audio:true,
                video:true,
                name: urlParams.get('userName')
            });
            

            me = room.localParticipant;

            //setup voice recognition
            var localMedia = me.mediaStream;
            v2tClient = new voiceClient(v2tCallback, config.v2tHost, localMedia);
            
            language = urlParams.get('userLanguage');
            document.title = urlParams.get('userName');

            render(room.localParticipant);
            room.remoteParticipants.forEach(render);
            
            room.on('participantJoined', async participant =>
            {
                var msg = new chatMessage('[System]', participant.name + ' joined', 'sys');
                msg.writeInChatBox();
                msg.sendToOthers();

                render(participant);
            });


            room.on('participantLeft', participant => {
                var msg = new chatMessage('[System]', participant.name + ' left', 'sys');
                msg.writeInChatBox();
                msg.sendToOthers();
                
                document.getElementById('video_' + participant.name + '_' + participant.address).remove();
            });

            room.on('messageReceived', (participant, msg) => {

                //We have to copy it here, the methods are lost on send/recv :(
                if(msg) {
                    var rcvdMsg = new chatMessage(msg.sender, msg.text, msg.type, msg.language);
                    rcvdMsg.writeInChatBox();
                }
            });

            window.onbeforeunload = function(){
                room.leave();
              };
        });


    function render(participant) {

        var targetDiv = document.getElementById('divOtherParticipants');

        if (participant.name == me.name &&
            participant.address == me.address)
        {
            targetDiv = document.getElementById('divMe');
        }

        const cardDiv = document.createElement('div');
        cardDiv.id = 'video_' + participant.name + '_' + participant.address;
        cardDiv.className = 'col-4 card bg-light text-center';
        participant.attach(cardDiv);


        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'card-body';
        cardDiv.appendChild(bodyDiv);

        const titleDiv = document.createElement('h5');
        titleDiv.className = 'card-title';
        if (participant.name == null) {participant.name = "noName"}
        titleDiv.innerHTML = participant.name +  " from " + language.toUpperCase();
        bodyDiv.appendChild(titleDiv);


        targetDiv.appendChild(cardDiv);
    }



    // function writeInChatBox(prefix, message)
    // {

    //     // var p2 = null;
    //     // if (prefix2 == null){
    //     //     p2 = "";
    //     // } else {
    //     //     p2 = "[" + prefix2 + "]";
    //     // }
    //     // textAreaChat.value += prefix + p2 + "[txt]: " + message + "\n";
    // }

});