requirejs(['/js/clientConfig.js'], function(clientConfig) {


    var me = null;
    var room = null;
    var inputMessage = document.getElementById("textSendMessage");
    var btnSendMessage = document.getElementById("btnSendMessage");
    var textAreaChat = document.getElementById("textAreaChat");

    btnSendMessage.addEventListener("click", async function(event) {
        writeInChatBox(me.name, inputMessage.value)
        await room.sendMessageToParticipant(inputMessage.value);
        inputMessage.value = '';
    }); 

    //The message will also be sent on <Enter>
    inputMessage.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            btnSendMessage.click();
        }
    }); 

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    

    fetch(clientConfig.host + '/getSingle?roomId=' + urlParams.get('roomId'))
        .then(response => {return response.json()})
        .then(async returnedRoom => {
            token = returnedRoom.token;

            room = await RealtimeSdk.joinRoom(token, {
                audio:false,
                video:true,
                name: urlParams.get('userName')
            });
            
            me = room.localParticipant;

            render(room.localParticipant);
            room.remoteParticipants.forEach(render);
            
            room.on('participantJoined', async participant =>
            {
                console.log(participant.name + ' joined.');
                render(participant);
            });


            room.on('participantLeft', participant => {
                document.getElementById('video_' + participant.name + '_' + participant.address).remove();
                console.log(participant.name + ' left.');
            });

            room.on('messageReceived', (participant, data) => {
                writeInChatBox(participant.name, data);
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