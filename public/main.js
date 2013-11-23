$('.btn-favorite').click(function() {
  var $el = $(this);
  var url = $el.attr('data-url');
  if (url) {
    if ($el.hasClass('active')) {
      $.ajax({ url: url, type: 'DELETE', success: function() { $el.removeClass('active'); $el.text('Like'); } });
    } else {
      $.ajax({ url: url, type: 'POST', success: function() { $el.addClass('active'); $el.text('Unlike'); } });
    }
  }
});
