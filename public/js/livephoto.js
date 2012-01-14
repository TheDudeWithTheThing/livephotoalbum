function addImage( d ) {
  var s = '<li><a class="span2 new_img" href="' + d.src + '" title="Added by ' + d.owner + '"><img class="thumbnail" src="' + d.src + '"/></a></li>';
  if($('.media-grid').children().length) {
    $('.media-grid').children(':first').before(s);
  } else {
    $('.media-grid').append(s);
  }
}

function addUser( u ) {
    removeUser(u);

    $('.user_list').append('<li id="' + u.id + '">' + u.name + '</li>');
}

function removeUser(u) {
  $('#' + u.id).remove();
}

function addChat(msg, styl) {
  $('#chat_window').append('<span class="' + styl + '">' + msg + '</span><br/>');
  $('#chat_window').scrollTop( $('#chat_window').prop('scrollHeight') );
}

function refreshLightbox() {
  $('.media-grid a').lightBox({imageLoading: '/img/lightbox-ico-loading.gif', 
                               imageBtnClose: '/img/lightbox-btn-close.gif',
                               imageBtnNext: '/img/lightbox-btn-next.gif',
                               imageBtnPrev: '/img/lightbox-btn-prev.gif',
                               imageBlank: '/img/lightbox-blank.gif'
  });

  $('img.thumbnail').imgCenter({scaleToFit: false, parentSteps: 0});

  $('.new_img').click( function(ev) {
    $(this).removeClass('new_img');
  });
}

function alertMessage(msg) {
  $('.alert-message').remove();
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
      alertMessage("Enter some datas");
    });

    socket.on('connect_rcv', function(user) {
      addChat('*** ' + user.name + ' connected', 'connect');
      addUser(user); 
    });

    socket.on('disconnect_rcv', function(user) {
      addChat('*** ' + user.name + ' disconnected', 'disconnect');
      removeUser(user);
    });

    socket.on('chat_send', function(msg) {
      var chat = '&lt;' + msg.user + '> ' + msg.msg;
      addChat(chat);
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

