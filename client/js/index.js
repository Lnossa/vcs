requirejs(['/js/clientConfig.js'], function (config) {

    /**
     * Gets all the available rooms and inserts them into the table
     * @returns {void}
     */
    function populateTable() {

        var roomContainer = document.getElementById('roomContainer')
        var divHandler = ''
        var index = 0

        //Get all available rooms 
        fetch(config.host + '/getAll', function (x) { console.log(x) })
            .then(response => { return response.json() })
            .then(rooms => {
                //console.log(rooms.data)
                //TODO: Change logic to populate page with Icons & buttons - replace table
                var placeholderRow = document.getElementById('placeholderRow');

                if (!rooms.data || rooms.data.length == 0) {
                    placeholderRow.innerHTML = "No rooms available."
                }
                else {
                    placeholderRow.remove();

                    rooms.data.forEach(room => {
                        switch(room.description){
                            case 'Landscapes':
                                divHandler = divHandler + "<div class=\"col-lg-3 col-md-4 col-sm-6  mt-5\" id=\"room-button\"><img src=\"/img/landscape.png\" class=\"room-logo\"></button></div>\n"
                            break;
                            case 'Yoga':
                                divHandler = divHandler + "<div class=\"col-lg-3 col-md-4 col-sm-6  mt-5\" id=\"room-button\"><img src=\"/img/yoga.png\" class=\"room-logo\"></div>\n"
                            break;
                            case 'Sound Therapy':
                                divHandler = divHandler + "<div class=\"col-lg-3 col-md-4 col-sm-6 mt-5\" id=\"room-button\"><img src=\"/img/sound.png\" class=\"room-logo\"></div>\n"
                            break;
                            case 'Boxing':
                                divHandler = divHandler + "<div class=\"col-lg-3 col-md-4 col-sm-6 mt-5\" id=\"room-button\"><img src=\"/img/boxing.png\" class=\"room-logo\"></div>\n"
                            break;
                        }

                        roomContainer.innerHTML = divHandler;
                        
                    });

                    //END OF FOR EACH
                    roomOnClickHandler();
                }
            });
    };

    function roomOnClickHandler() {
        var roomBtn = document.querySelectorAll('#room-button')
        for(let i=0;i<roomBtn.length;i++)
        roomBtn[i].addEventListener('click',async function onClick(){
            let obj;
            const res = await fetch(config.host + '/getAll')
            obj = await res.json();

            console.log(i)
            console.log(obj.data[i].name)
            console.log(obj.data[i].id)



            document.getElementById('joinRoomModalLabel').innerHTML = ("Join " + obj.data[i].name);
            document.getElementById('roomId').value = obj.data[i].id;
             $('#joinRoomModal').modal('show');
        })
      }
      
      


    //call populateTable
    populateTable();

    /**
     * Creates buttons on each row, for every room
     * @param {string} btnType 
     * @param {string} id 
     * @param {string} name 
     * @returns {HTMLElement} A new HTML button element
     */
     function createButton(btnType, id, name) {

        let btn = document.createElement('icon');
        btn.setAttribute('type', 'button');

        if (btnType == 'Delete')
            btn.setAttribute('class', 'bi bi-trash-fill text-danger');
        else if (btnType == 'Join')
            btn.setAttribute('class', 'bi bi-telephone-plus-fill text-info');

        btn.onclick = function () {
            if (btnType == 'Delete') {
                if (confirm('Delete ' + name + '?')) {
                    document.getElementById(id).remove();
                    fetch(config.host + '/delete?id=' + id);
                }
            }
            if (btnType == 'Join') {
                document.getElementById('joinRoomModalLabel').innerHTML = ("Join " + name);
                document.getElementById('roomId').value = id;
                $('#joinRoomModal').modal('show');
            }
        }
        return btn;
    };
    
    
});