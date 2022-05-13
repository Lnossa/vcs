requirejs(['/js/clientConfig.js', '/js/voiceClient.js'], function(config, voiceClient) {


    var me = null;
    var room = null;
    var s2tClient = null;
    var inputMessage = document.getElementById("textSendMessage");
    var btnSendMessage = document.getElementById("btnSendMessage");
    var textAreaChat = document.getElementById("textAreaChat");
    var switchVoiceToText = document.getElementById("switchVoiceToText");

    btnSendMessage.addEventListener("click", async function() {
        writeInChatBox(me.name, inputMessage.value)
        var message = {
            type: 'text',
            text: inputMessage.value
        };
        inputMessage.value = '';
        await room.sendMessageToParticipant(message);
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
            s2tClient.startRecording();
        }
        else {
            s2tClient.stopRecording();
        }
    })

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);



    async function s2tCallback(text) {
        writeInChatBox("[Speech2Text] " + me.name, text);
        var message = {
            type: "v2t",
            text: text
        }
        await room.sendMessageToParticipant(message);
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
            s2tClient = new voiceClient(s2tCallback, config.s2tHost, localMedia);
            

            render(room.localParticipant);
            room.remoteParticipants.forEach(render);
            
            room.on('participantJoined', async participant =>
            {
                writeInChatBox('[System]', participant.name + ' joined.');
                render(participant);
            });


            room.on('participantLeft', participant => {
                writeInChatBox('[System]', participant.name + ' left.');
                document.getElementById('video_' + participant.name + '_' + participant.address).remove();
            });

            room.on('messageReceived', (participant, data) => {
                var type = data.type == 'v2t' ? '[Speech2Text]' : 
                           data.type == 'sys' ? '[System]' : '';
                writeInChatBox(type + ' ' + participant.name, data.text);
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
        titleDiv.innerHTML = participant.name;
        bodyDiv.appendChild(titleDiv);


        targetDiv.appendChild(cardDiv);
    }



    function writeInChatBox(prefix, message)
    {
        textAreaChat.value += prefix + ": " + message + "\n";
    }

});