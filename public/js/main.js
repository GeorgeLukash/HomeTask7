jQuery(function ($) {
    var socket = io.connect();
    var $messageForm = $('#send-messages');
    var $messageBox = $('#message');
    var $chat = $('#chat');
    var $nicknameForm = $('#setNick');
    var $nickError = $('#nickError');
    var $nickBox = $('#nickname');
    var $users = $('#users');

    $nicknameForm.submit(function (e) {
        e.preventDefault();
        socket.emit('new user', $nickBox.val(), function (data) {
            if (data) {
                $('#nickWrap').hide();
                $('#contentWrap').show();                
            } else {
                $nickError.show();
                $nickError.html('That user name is already taken!! Try again...');
            }
        });

        $nickBox.val('');
    });

    socket.on('usernames', function (data) {
        $users.empty();
        for (var i = 0; i < data.length; i++) {
            var html = document.createElement('li');
            html.innerHTML = data[i];
            $users.append(html);
        }
    });

    $messageForm.submit(function (e) {
        e.preventDefault();
        socket.emit('send message', $messageBox.val(), function (data) {
            $chat.append('<li class="error">' + data + "</li>");
        });
        $messageBox.val('');
    });

    socket.on('load old msgs', function (docs) {
        for (var i = docs.length - 1; i >= 0; i--) {
            displayMsg(docs[i]);
        }
    });

    socket.on('new message', function (data) {
        displayMsg(data);
    });

    function displayMsg(data) {
        $chat.append('<li class="msg"><b>' + data.nick + '</b><br/>' + data.msg + ' ' + '<br/><br/><span class="date">' + new Date(data.createdAt) + '</span>' + "</li>");
    };

    socket.on('whisper', function (data) {
        $chat.append('<li class="whisper"><b>' + data.nick + '</b> whispered <br/>' + data.msg + ' ' + '<br/><br/><span class="date">' + new Date(data.createdAt) + '</span>' + "</li>");
    });

});