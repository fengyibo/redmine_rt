(function() {
  $(window).load(function() {
  
  $('#quick_notes_ta').each(function () {
    this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
  }).on('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
  
  if( $("#history").attr("data-comment_sorting") == "desc") {
    // move div quick_notes to bottom of div history
    $("#quick_notes").insertAfter( $("#history") );
  }
  
  console.log("SETTING ON CLICK");
  $('#quick_notes_btn').click(function(e) {
    console.log("clicked");
    e.stopPropagation();
    e.preventDefault();
    if (e.handled == true) {
      return;
    }
    e.handled = true;
    var $ta = $('#quick_notes_ta');
    if($ta.val().trim() == '') {
      return;
    }
    var data = {
      issue: {
        notes: $ta.val(),
        private_notes: $("#quick_notes_private_cbox").is(":checked") ? true : false
      }
    };
  
    console.log("sending PUT");
    $.ajax({
      url: window.location.pathname + "/add_quick_notes",
      method: 'PUT',
      dataType: "text", // Expected type of server response body
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(data),
      success: function(response) {
        console.log("PUT succcess");
        $ta.val('');
        $ta.removeData('changed');
      },
      error: function(textStatus, err) {
        console.log("PUT failed: " + textStatus);
        console.dir(err);
  
        $( "#operation_failed_message" ).dialog({
          modal: true,
          buttons: {
           Ok: function() {
             $( this ).dialog( "close" );
           }
          }
        });
      }
    });
  });
  });
  
  if(window.location.pathname.indexOf("/issues/") >= 0) {
  
    var remove = function(id) {
      var item = $("#change-" + id);
      item.hide(800, function() {
        // Animation complete.
        item.remove();
      });
    };
  
    var add_or_update_note = function(id, indice) {
      var $history = $("#history");
  
      var sorting = $history.attr('data-comment_sorting');
  
      var existing_note = indice != null ? true : false;
  
      var last;
  
      var $history_children = $history.find("> div");
      if( sorting == 'desc') {
        $last = $history_children.last();
      } else {
        $last = $history_children.first();
      }
  
      if(!indice) {
        indice = 1;
        if($last.length > 0) {
          indice = parseInt($last.find("div[id|='note']").attr("id").split("-")[1]) + 1;
        }
      }
  
      $.get( "/journals/" + id + "?indice=" + indice, function( data, statusText, jqXHR ) {
        console.log("GET /journals got statusText=" + statusText);
  
        console.log(lock_version);
        var lock_version = jqXHR.getResponseHeader("X-issue-lock-version");
  
        $("#issue_lock_version").attr("value", lock_version);
  
        var item = $.parseHTML(data);
  
        if(existing_note) {
          console.log("existind note");
          $("#note-" + indice).parent().replaceWith(item);
        } else {
          $(item).css('display', 'none');
  
          if( sorting == 'desc') {
            $history.append(item);
          } else {
            $(item).insertAfter($history.find("h3"));
          }
          $(item).show(800);
        }
      });
    };

    App.messages = App.cable.subscriptions.create({
      channel: 'RedmineRt::MessagesChannel',
      issue_id: $('meta[name=page_specific_js]').attr('issue_id')
    }, 
    {
      received: function(msg) {
        console.log("got msg");
        console.log(msg);
        if(msg.type == "journal_deleted") {
          remove(msg.journal_id);
        } else if(msg.type == "journal_saved") {
          var $item = $("#change-" + msg.journal_id);
          if($item.length == 0) {
            console.log("element absent. Adding it")
            add_or_update_note(msg.journal_id); 
            $("#last_journal_id").attr("value", msg.journal_id);
          } else {
            console.log("element already exists");
            var indice = $item.find("div[id|='note']").attr("id").split("-")[1];
            add_or_update_note(msg.journal_id, indice); 
          }
        } else if(msg.event == "error") {
          $( "#unauthorized_message" ).dialog({
            modal: true,
            buttons: {
              Ok: function() {
                $( this ).dialog( "close" );
              }
            }
          });
          App.cable.close();
        }
      }
    });
  }
  
}).call(this);
  
