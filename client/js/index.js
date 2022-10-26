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
                    if (placeholderRow)
                        placeholderRow.remove();
                    roomContainer.innerHTML = "<h1>No rooms available</h1>";
                }
                else {
                    if (placeholderRow)
                        placeholderRow.remove();

                    rooms.data.forEach(room => {
                        switch (room.description) {
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


    async function onClickDelete(index) {
        let obj;
        const res = await fetch(config.host + '/getAll')
        obj = await res.json();

        console.log(index)
        console.log(obj.data[index].name)
        console.log(obj.data[index].id)


        if (confirm('Delete ' + obj.data[index].name + '?')) {
            fetch(config.host + '/delete?id=' + obj.data[index].id);
        }
        fetch(config.host + '/getAll')
            .then(populateTable())

    }
    async function onClickJoin(roomType) {
        let obj;
        const res = await fetch(config.host + '/getAll')
        obj = await res.json();

        for(i=0;i<obj.data.length;i++)
            if(obj.data[i].description===roomType){
                document.getElementById('joinRoomModalLabel').innerHTML = ("Join " + obj.data[i].name + '(' +obj.data[i].description + ')');
                document.getElementById('roomId').value = obj.data[i].id;
                $('#joinRoomModal').modal('show');
            }
        }




    var toggleRemove = true
        function onClickHandler() {
            toggleRemove = !toggleRemove
            if (toggleRemove === true) {
                console.log('Remove Mode On')
                var roomIcons = document.getElementsByClassName('room-logo')
                for (var i = 0; i < roomIcons.length; i++)
                    roomIcons[i].style.cssText += 'filter: drop-shadow(2px 4px 6px red)';

                var roomBtn = document.querySelectorAll('#room-button')
                for (let i = 0; i < roomBtn.length; i++) {
                    var old_element = roomBtn[i]
                    var new_element = old_element.cloneNode(true);
                    old_element.parentNode.replaceChild(new_element, old_element);
                }

                var roomBtn = document.querySelectorAll('#room-button')
                for (let i = 0; i < roomBtn.length; i++) {
                    roomBtn[i].addEventListener('click', onClickDelete.bind(this, i))

                }
            } else {
                console.log('Remove Mode Off')
                var roomIcons = document.getElementsByClassName('room-logo')
                for (var i = 0; i < roomIcons.length; i++)
                    roomIcons[i].style.cssText += 'filter: none';

                var roomBtn = document.querySelectorAll('#room-button')
                for (let i = 0; i < roomBtn.length; i++) {
                    var old_element = roomBtn[i]
                    var new_element = old_element.cloneNode(true);
                    old_element.parentNode.replaceChild(new_element, old_element);
                }

                var roomBtn = document.querySelectorAll('#room-button')
                for (let i = 0; i < roomBtn.length; i++)
                    roomBtn[i].addEventListener('click', onClickJoin.bind(this, i))
            }
        }

        var removeBtn = document.getElementById('removeButton')
        removeBtn.addEventListener('click', onClickHandler)

        var step = 1
        var results = []
        var nextQuestionBtn = document.getElementById('nextQuestionButton')
        nextQuestionBtn.addEventListener('click', function onClick() {
            results[step] = document.getElementById('customRange' + step).value

            step++
            var currentPageIndex = step
            var lastPageIndex = step - 1


            if (step < 6) {
                document.getElementById('Q' + lastPageIndex + 'Wrapper').style.visibility = 'hidden'
                document.getElementById('Q' + lastPageIndex + 'Wrapper').style.position = 'absolute'
                document.getElementById('Q' + currentPageIndex + 'Wrapper').style.visibility = 'visible'
                document.getElementById('Q' + currentPageIndex + 'Wrapper').style.position = 'fixed'
            }

            if (step === 5) {
                nextQuestionBtn.innerHTML = 'Finish'
                nextQuestionBtn.addEventListener('click', function onClick() {
                    popupForm.remove();
                    // var divRow = document.createElement('div')
                    // divRow.className='row justify-content-md-center'
                    // var icon = document.createElement("img") //img src="/img/landscape.png" id="room-button" class="room-logo"
                    // icon.src="/img/landscape.png"
                    // icon.id="room-button"
                    // icon.className="room-logo"
                    // divRow.appendChild(icon)
                    // var mainContainer = document.getElementById('mainContainer')
                    // mainContainer.appendChild(divRow)
                    var max = 1
                    var indexesOfMax = []
                    var mainContainer = document.getElementById('mainContainer')
                    for (i = 1; i <= 5; i++) {
                        if (results[i] > max)
                            max = results[i]
                    }
                    console.log(max)

                    for (i = 1; i <= 5; i++) {
                        if (results[i] === max)
                            indexesOfMax.push(i)
                    }

                    console.log(indexesOfMax)

                    var divRow = document.createElement('div')
                    divRow.className = 'row recommanded-row'

                    var recommandedHeader = document.createElement('h3')
                    // recommandedHeader.className = 'text-center'
                    recommandedHeader.textContent = 'We recommand you'

                    var col1 = document.createElement('div')
                    col1.className = 'col-6 justify-content-md-center'

                    col1.appendChild(recommandedHeader)
                    divRow.append(col1)
                    mainContainer.append(divRow)


                    var k=0
                    indexesOfMax.forEach(function (currentValue) {
                        switch (currentValue) {
                            case 1:
                                console.log('1 max')
                                var icon = document.createElement("img")
                                icon.src = "/img/yoga.png"
                                icon.id = "room-button"
                                icon.className = "room-logo"
                                icon.addEventListener('click',onClickJoin.bind(this, 'Yoga'))
                                col1.append(icon)
                                break
                            case 2:
                                console.log('2 max')
                                var icon = document.createElement("img")
                                icon.src = "/img/landscape.png"
                                icon.id = "room-button"
                                icon.className = "room-logo"
                                icon.addEventListener('click',onClickJoin.bind(this, 'Landscapes'))
                                col1.append(icon)
                                break
                            case 3:
                                var icon = document.createElement("img")
                                icon.src = "/img/chiropractice.png"
                                icon.id = "room-button"
                                icon.className = "room-logo"
                                icon.addEventListener('click',onClickJoin.bind(this, 'Chiro'))
                                col1.append(icon)
                                break
                            case 4:
                                console.log('4 max')
                                var icon = document.createElement("img")
                                icon.src = "/img/boxing.png"
                                icon.id = "room-button"
                                icon.className = "room-logo"
                                icon.addEventListener('click',onClickJoin.bind(this, 'Boxing'))
                                col1.append(icon)
                                break
                            case 5:
                                console.log('5 max')
                                var icon = document.createElement("img")
                                icon.src = "/img/sound.png"
                                icon.id = "room-button"
                                icon.className = "room-logo"
                                icon.addEventListener('click', onClickJoin.bind(this, 'Sound Therapy'))
                                col1.append(icon)
                                break

                        }
                    })

                    

                    var indexOfSuggestions = []

                    for (i = 1; i <= 5; i++) {
                        if (results[i] < max && results[i] > 2)
                            indexOfSuggestions.push(i);
                    }
                    console.log(indexOfSuggestions.length)
                    if (indexOfSuggestions.length!=0) {
                        var col2 = document.createElement('div')
                        col2.className = 'col-6 justify-content-md-center'

                        var otherHeader = document.createElement('h3')
                        // otherHeader.className = 'text-center'
                        otherHeader.textContent = 'other suggestions...'

                        col2.append(otherHeader)

                        indexOfSuggestions.forEach(function (currentValue) {
                            switch (currentValue) {
                                case 1:
                                    var icon = document.createElement("img")
                                    icon.src = "/img/yoga.png"
                                    icon.id = "room-button"
                                    icon.className = "room-logo"
                                    icon.addEventListener('click',onClickJoin.bind(this, 'Yoga'))
                                    col2.append(icon)
                                    break
                                case 2:
                                    var icon = document.createElement("img")
                                    icon.src = "/img/landscape.png"
                                    icon.id = "room-button"
                                    icon.className = "room-logo"
                                    icon.addEventListener('click',onClickJoin.bind(this, 'Landscapes'))
                                    col2.append(icon)
                                    break
                                case 3:
                                    var icon = document.createElement("img")
                                    icon.src = "/img/chiropractice.png"
                                    icon.id = "room-button"
                                    icon.className = "room-logo"
                                    icon.addEventListener('click',onClickJoin.bind(this, 'Chiro'))
                                    col2.append(icon)
                                    break
                                case 4:
                                    var icon = document.createElement("img")
                                    icon.src = "/img/boxing.png"
                                    icon.id = "room-button"
                                    icon.className = "room-logo"
                                    icon.addEventListener('click',onClickJoin.bind(this, 'Boxing'))
                                    col2.append(icon)
                                    break
                                case 5:
                                    var icon = document.createElement("img")
                                    icon.src = "/img/sound.png"
                                    icon.id = "room-button"
                                    icon.className = "room-logo"
                                    icon.addEventListener('click', onClickJoin.bind(this, 'Sound Therapy'))
                                    col2.append(icon)
                                    break
    
                            }
                        })

                        divRow.append(col2)
                    }

                    var roomBtn = document.querySelectorAll('#room-button')
                    for (let i = 0; i < roomBtn.length; i++)
                        roomBtn[i].addEventListener('click', onClickJoin.bind(this, i))

                })
            }
        })
        var closeButton = document.getElementById('closeBtn')
        var wawButton = document.getElementById('wawButton')
        var popupForm = document.getElementById('popupForm')
        wawButton.addEventListener('click', function onClick() {
            popupForm.style.visibility = 'visible';
        })
        closeButton.addEventListener('click', function onClick() {
            popupForm.style.visibility = 'hidden';
        })

        //call populateTable
        //populateTable();

    });