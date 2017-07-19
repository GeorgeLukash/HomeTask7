var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
    mongoose = require('mongoose'),
	    users = {};

mongoose.Promise = global.Promise;
app.use(express.static(__dirname + '/public'));

server.listen(8080);

mongoose.connect('mongodb://localhost/chatDB', (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to mogodb!!');
    }
});

var chatSchema = mongoose.Schema({
    nick: String,
    msg: String,
    createdAt: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

io.sockets.on('connection', function (socket) {
    var query = Chat.find({}); 
    query.sort('-createdAt').limit(100).exec( function (err, docs) {
        if (err) throw err;        
        socket.emit('load old msgs', docs);
    });


    socket.on('new user', function (data, callback) {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket
            updateNicknames();
        }
    });

    function updateNicknames() {
        io.sockets.emit('usernames', Object.keys(users));
    }

    socket.on('send message', function (data, callback) {
        var msg = data.trim();
        if (msg.substr(0, 3) === '/w ') {
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            if (ind !== -1) {
                var name = msg.substr(0, ind);
                var msg = msg.substring(ind + 1);
                if (name in users) {
                    users[name].emit('whisper', { msg: msg, nick: socket.nickname, createdAt: new Date() });
                } else {
                    callback('Error: Enter a valid user');
                }
            } else {
                callback('Error : Please enter a message in your whisper');
            }

        } else {

            var newMsg = new Chat({ msg: msg, nick: socket.nickname });
            newMsg.save(function (err) {
                if (err) throw err;
                io.sockets.emit('new message', { msg: msg, nick: socket.nickname, createdAt: new Date()});
            }); 


        }
    });

    socket.on('disconnect', function (data) {
        if (!socket.nickname) return;
        delete users[socket.nickname];     
        updateNicknames();
    });
});