var fs = require('fs');
var https = require('https');
var express = require('express');
var roomApi = require('./src/roomApi');
var googleTranslate = require('./src/GoogleTranslate/translate');

const SERVER_PORT = 8000;

// Setup and start application
//********************************************************
var app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());

var serverOptions = {
    key: fs.readFileSync('cert/client-key.pem'),
    cert: fs.readFileSync('cert/client-cert.pem')
}

var server = https.createServer(serverOptions, app)
    .listen(SERVER_PORT, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('App started, listening %s:%s', host, port);
    });



//Resources
//********************************************************
app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/res'));
app.use('/favicon.ico', express.static('./favicon.ico'));



//Pages
//********************************************************

// Main page
app.get('/', function (req,res){
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.write(fs.readFileSync("client/index.html"));
    res.end();
});

// Join room
app.get('/room', async function(req,res) {
    var room = null;
    if(req.query && req.query.roomId)
    {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.write(fs.readFileSync("client/room.html"));
    }
    res.end();
});




//REST (JSON) 
//********************************************************

// Get all rooms
app.get('/getAll', async function(req, res){
    var rooms = await roomApi.getAll();
    res.writeHead(200);
    res.write(JSON.stringify(rooms));
    res.end();
});

// Get single room
app.get('/getSingle', async function(req, res){
    var room = null;
    if(req.query && req.query.roomId)
    {
        room = await roomApi.getSingle(req.query.roomId);
    }

    if(room.token)
    {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(room));
    }
    else{
        console.log(room);
    }
    
    res.end();
});

// Create room
app.post('/create', async function(req,res){

    var status = 200;
    if (req.body.roomName && 
        req.body.roomDesc) {
            await roomApi.create(req.body.roomName, req.body.roomDesc, "SFU");
    }
    else {
        status = 400; 
    }

    
    if(status < 400) {
            //Redirect
            res.writeHead(302, {
                'Location': '/'
            });
    }
    else {
        console.log('Error %d! url: %s', status, req.url);
    }
    res.end();
});

// Delete room
app.get('/delete', async function(req,res){
    if(req.query.id) {
        await roomApi.delete(req.query.id);
    }

    //Redirect
    res.writeHead(302, {
        'Location': '/'
    });
    res.end();
});

//Translate text
app.get('/translate', async function(req, res){
    
    var translationResult = '';
    
    if(req.query.text && req.query.from && req.query.to) {
        translationResult = await googleTranslate.translateText(req.query.text, req.query.from, req.query.to);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(translationResult));
    }
    else {
        res.writeHead(400);
        res.write('Bad request!');        
    }


    res.end();
});