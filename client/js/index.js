requirejs(['/js/clientConfig.js'], function (config) {

    /**
     * Gets all the available rooms and inserts them into the table
     * @returns {void}
     */
    function populateTable() {

        var roomContainer = document.getElementById('roomContainer')
        var divHandler = ''

        //Get all available rooms 
        fetch(config.host + '/getAll', function (x) { console.log(x) })
            .then(response => { return response.json() })
            .then(rooms => {
                //console.log(rooms.data)
                //TODO: Change logic to populate page with Icons & buttons - replace table
                var placeholderRow = document.getElementById('placeholderRow');
                

                if (!rooms.data || rooms.data.length == 0) {
                    console.log('norooms')
                    if(placeholderRow)
                    placeholderRow.remove();
                    roomContainer.innerHTML = "<h1>No rooms available</h1>";
                }
                else{
                    if(placeholderRow)
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
                    onClickHandler();
                }
            });
    };


    async function onClickDelete(index){
                let obj;
                const res = await fetch(config.host + '/getAll')
                obj = await res.json();

                console.log(index)
                console.log(obj.data[index].name)
                console.log(obj.data[index].id)


                if (confirm('Delete ' + obj.data[index].name + '?')) {
                fetch(config.host + '/delete?id=' + obj.data[index].id);
                populateTable();
        }
    }   
    async function onClickJoin(index){
        let obj;
            const res = await fetch(config.host + '/getAll')
            obj = await res.json();

            console.log(index)
            console.log(obj.data[index].name)
            console.log(obj.data[index].id)



            document.getElementById('joinRoomModalLabel').innerHTML = ("Join " + obj.data[index].name);
            document.getElementById('roomId').value = obj.data[index].id;
             $('#joinRoomModal').modal('show');
    }




      var toggleRemove=true
      function onClickHandler(){
        toggleRemove = !toggleRemove
        if(toggleRemove===true){
            console.log('Remove Mode On')
            var roomIcons = document.getElementsByClassName('room-logo')
            for(var i=0;i<roomIcons.length;i++)
            roomIcons[i].style.cssText += 'filter: drop-shadow(2px 4px 6px red)';

            var roomBtn = document.querySelectorAll('#room-button')
            for(let i=0;i<roomBtn.length;i++)
            {var old_element = roomBtn[i]
            var new_element = old_element.cloneNode(true);
            old_element.parentNode.replaceChild(new_element, old_element);
            }        
           
            var roomBtn = document.querySelectorAll('#room-button')
            for(let i=0;i<roomBtn.length;i++)
            {roomBtn[i].addEventListener('click',onClickDelete.bind(this,i))
            
        }
    }else{
            console.log('Remove Mode Off')
            var roomIcons = document.getElementsByClassName('room-logo')
            for(var i=0;i<roomIcons.length;i++)
            roomIcons[i].style.cssText += 'filter: none';

            var roomBtn = document.querySelectorAll('#room-button')
            for(let i=0;i<roomBtn.length;i++)
            {var old_element = roomBtn[i]
            var new_element = old_element.cloneNode(true);
            old_element.parentNode.replaceChild(new_element, old_element);
            }
            
            var roomBtn = document.querySelectorAll('#room-button')
            for(let i=0;i<roomBtn.length;i++)
            roomBtn[i].addEventListener('click',onClickJoin.bind(this,i))
        }
      }

      var removeBtn = document.getElementById('removeButton')
      removeBtn.addEventListener('click', onClickHandler)
    
    //call populateTable
    populateTable();
    
});