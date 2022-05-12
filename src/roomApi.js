const req = require('express/lib/request');
const https = require('https');
const apiConfig = require('./apiConfig')


module.exports = {

    //Create room
    create : function(roomName, roomDesc, roomType) {

        const data = JSON.stringify(
            {
                name: roomName,
                description: roomDesc,
                roomType: roomType
            });

        const requestParameters = {
            hostname: apiConfig.vcsApi.host,
            port: 443,
            path: '/api/realtime/room',
            method: 'POST',
            headers: {
                'x-vcs-token': apiConfig.vcsApi.key,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };


        return new Promise((resolve, reject) => {
            const req = https.request(requestParameters, function(res) {
                var output = '';
                res.on('data', function(data){
                    output += data;
                });

                res.on('end', function(){
                    resolve(JSON.parse(output));
                });

                res.on('error', function(error) {
                    reject(error);
                });
            });
            req.write(data);
            req.end();
        });
    },

    //Get all rooms
    getAll : function() {

        //Setup GET Request Parameters
        const requestParameters = {
            hostname: apiConfig.vcsApi.host,
            port: 443,
            path: '/api/realtime/room',
            method: 'GET',
            headers: {
                'x-vcs-token': apiConfig.vcsApi.key
            }
        };

        //Begin request
        return new Promise((resolve, reject) => {
            https.request(requestParameters, function(res){
            
                var output = '';
                res.on('data', function(data){
                    output += data;
                });

                res.on('end', function(){
                    resolve(JSON.parse(output));
                });

                res.on('error', function(error) {
                    reject(error);
                });
            }).end();
        });
    },

    getSingle : function (id) {

        //Setup GET Request Parameters
        const requestParameters = {
            hostname: apiConfig.vcsApi.host,
            port: 443,
            path: '/api/realtime/room/' + id,
            method: 'GET',
            headers: {
                'x-vcs-token': apiConfig.vcsApi.key
            }
        };

        //Begin request
        return new Promise((resolve, reject) => {
            https.request(requestParameters, function(res){
            
                var output = '';
                res.on('data', function(data){
                    output += data;
                });

                res.on('end', function(){
                    resolve(JSON.parse(output));
                });

                res.on('error', function(error) {
                    reject(error);
                });
            }).end();
        });
    },

    //Delete room
    delete : function(id) {

        //Setup DELETE Request Parameters
        const requestParameters = {
            hostname: apiConfig.vcsApi.host,
            port: 443,
            path: '/api/realtime/room?id=' + id,
            method: 'DELETE',
            headers: {
                'x-vcs-token': apiConfig.vcsApi.key
            }
        };

        //Begin request
        return new Promise((resolve, reject) => {
            https.request(requestParameters, function(res){
            
                var output = '';
                res.on('data', function(data){
                    output += data;
                });

                res.on('end', function(){
                    resolve(JSON.parse(output));
                });

                res.on('error', function(error) {
                    reject(error);
                });
            }).end();
        });
    }
};