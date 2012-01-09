var socket = io.connect('http://dev.sbutler.org:3000');

function addImage( d ) {
    $('.media-grid').children(':first').before('<li><a href="' + d.src + '" title="Added by ' + d.owner + '"><img class="thumbnail span2" src="' + d.src + '"/></a></li>');
}

function refreshLightbox() {
  $('.media-grid a').lightBox({imageLoading: '/img/lightbox-ico-loading.gif', 
                               imageBtnClose: '/img/lightbox-btn-close.gif',
                               imageBtnNext: '/img/lightbox-btn-next.gif',
                               imageBtnPrev: '/img/lightbox-btn-prev.gif'
  });
}

function alertMessage(msg) {
  $('.topbar').after('<div class="alert-message error">' + msg + '</div>');    
}

$(document).ready( function() {

  socket.on('new_pic', function (data) {
    addImage(data);
    refreshLightbox();
  });

  socket.on('not_logged_in', function() {
    alertMessage("Must be logged in for posting n00dz");
  });

  socket.on('no_data', function() {
    alertMessage("Enter some datas");
  });

  $('#go_button').click( function(ev) {
    $('.alert-message').remove();
    var img = $('#url').val();
    socket.emit('get_pic', img);
    $('#url').val('');
  });

  refreshLightbox();
  
});

