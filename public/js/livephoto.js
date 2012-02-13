function addImage( d ) {
  var s = '<li><a class="span2 new_img" href="' + d.src + '" title="Added by ' + d.owner + '"><img class="thumbnail" src="' + d.src + '"/></a></li>';

  var media_grid = $('.media-grid');

  // we want to limit to 9 images, remove last one then add new one
  if(media_grid.children().length > 8) {
    media_grid.children(':last').remove();
  }

  if(media_grid.children().length) {
    media_grid.children(':first').before(s);
  } else {
    media_grid.append(s);
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
  var chat_window = $('#chat_window');
  chat_window.append('<span class="' + styl + '">' + msg + '</span><br/>');
  chat_window.scrollTop( chat_window.prop('scrollHeight') );
}

function refreshLightbox() {
  $('.media-grid').find('a').lightBox({imageLoading: '/img/lightbox-ico-loading.gif', 
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

    socket.on('error', function(data) {
      alertMessage(data);
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
      var url = $('#url');
      $('.alert-message').remove();
      var img = url.val();
      socket.emit('get_pic', img);
      url.val('');
    });

    var chat_message = $('#chat_msg');
    chat_message.keydown( function(ev) {
      // return pressed
      if (ev.which == '13')
      {
        $('.alert-message').remove();
        var chats = chat_message.val();
        socket.emit('chat_rcv', chats);
        chat_message.val('');
      }
    });

    refreshLightbox();
  }
});
