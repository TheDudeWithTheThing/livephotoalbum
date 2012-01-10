function addImage( d ) {
    $('.media-grid').children(':first').before('<li><a href="' + d.src + '" title="Added by ' + d.owner + '"><img class="thumbnail span2" src="' + d.src + '"/></a></li>');
}

function addUser( u ) {
    removeUser(u);
    $('.user_list').append('<li id="' + u + '">' + u + '</li>');
}

function removeUser(u) {
  $('#'+u).remove();
}

function addChat( c ) {
  var msg = '&lt;' + c.user + '> ' + c.msg + '<br/>';
  $('#chat_window').append(msg);
  $('#chat_window').scrollTop( $('#chat_window').prop('scrollHeight') );
}

function refreshLightbox() {
  $('.media-grid a').lightBox({imageLoading: '/img/lightbox-ico-loading.gif', 
                               imageBtnClose: '/img/lightbox-btn-close.gif',
                               imageBtnNext: '/img/lightbox-btn-next.gif',
                               imageBtnPrev: '/img/lightbox-btn-prev.gif',
                               imageBlank: '/img/lightbox-blank.gif'
  });
}

function alertMessage(msg) {
  $('.topbar').after('<div class="alert-message error">' + msg + '</div>');    
}

$(document).ready( function() {
 
  // only do this stuff if we have a valid socket
  
  if(socket) {
    socket.on('new_pic', function (data) {
      addImage(data);
      refreshLightbox();
    });

    socket.on('not_logged_in', function() {
      alertMessage("Not logged in");
    });

    socket.on('no_data', function() {
      $('.alert-message').remove();
      alertMessage("Enter some datas");
    });

    socket.on('connect_rcv', function(user) {
      addUser(user); 
    });

    socket.on('disconnect_rcv', function(user) {
      removeUser(user);
    });

    socket.on('chat_send', function(msg) {
      addChat(msg);
    });

    $('#go_button').click( function(ev) {
      $('.alert-message').remove();
      var img = $('#url').val();
      socket.emit('get_pic', img);
      $('#url').val('');
    });

    $('#chat_msg').keydown( function(ev) {
      // return pressed
      if (ev.which == '13')
      {
        $('.alert-message').remove();
        var chats = $('#chat_msg').val();
        socket.emit('chat_rcv', chats);
        $('#chat_msg').val('');
      }
    });

    refreshLightbox();
  }
});

