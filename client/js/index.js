requirejs(['/js/clientConfig.js'], function (config) {

    /**
     * Gets all the available rooms and inserts them into the table
     * @returns {void}
     */
    function populateTable() {

        var table = document.getElementById('roomTableBody');

        var index = 1;

        //Get all available rooms 
        fetch(config.host + '/getAll', function (x) { console.log(x) })
            .then(response => { return response.json() })
            .then(rooms => {

                var placeholderRow = document.getElementById('placeholderRow');

                if (!rooms.data || rooms.data.length == 0) {
                    placeholderRow.innerHTML = "No rooms available."
                }
                else {
                    placeholderRow.remove();

                    rooms.data.forEach(room => {
                        var row = table.insertRow(index - 1);
                        row.setAttribute("id", room.id);

                        var indexCell = row.insertCell(0);
                        var nameCell = row.insertCell(1);
                        var descCell = row.insertCell(2);
                        var joinCell = row.insertCell(3);
                        var delCell = row.insertCell(4);

                        indexCell.innerHTML = index;
                        indexCell.setAttribute('style', 'text-align:center;');
                        nameCell.innerHTML = room.name;
                        descCell.innerHTML = room.description;
                        joinCell.appendChild(createButton('Join', room.id, room.name, ""));
                        joinCell.setAttribute('style', 'text-align:center;');
                        joinCell.setAttribute('class', 'col-sm-1');
                        delCell.appendChild(createButton('Delete', room.id, room.name));
                        delCell.setAttribute('style', 'text-align:center;');
                        delCell.setAttribute('class', 'col-sm-1');

                        index++;
                    });
                }
            });
    };

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