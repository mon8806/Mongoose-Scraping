// Grab the articles as a json
$.getJSON("/articles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
  }
});


// Whenever someone clicks a p tag
$("#wrapper").on("click", function () {
  // Empty the notes from the note section


  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function (data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

//Handle Save Article button
$(".savebutton").on("click", function () {
  var payload = {}
  var $article = $(this)
  var siblings = $(this).siblings()
  payload.title = siblings[0].innerText;
  payload.summary = siblings[1].innerText;
  payload.link = siblings[2].innerText;
  payload.id = $(this).attr("data-id");

  $.ajax({
    headers: {
      "Content-Type": "application/json"
    },
    type: "POST",
    url: "/articles",
    data: JSON.stringify(payload)
  }).done(function (data) {
    window.alert("Article Saved!")
    $article.parent().parent().hide()
  })
});

$(".addCommentbutton").on("click", function (e) {
  e.preventDefault();
  var payload = {}
  payload.id = $(this).attr("data-id");
  payload.body = $("#" + payload.id).val();
  console.log(payload)
  $.ajax({
    headers: {
      "Content-Type": "application/json"
    },
    type: "POST",
    url: "/articles/" + payload.id,
    data: JSON.stringify(payload)
  })
    .then(function (data) {
      window.alert("Added Comment!")
      window.location = "/articles"

    })
    .done(function (data) {
    })
});

//Handle Delete Article button
$("#deleteButton").on("click", function () {
  var thisId = $(this).attr("data-id");
  $.ajax({
    method: "GET",
    url: "/clearDb"
  }).done(function (data) {
    window.location = "/articles"
  })
});

$(".deleteArticle").on("click", function () {
  console.log("In Delete Article")
  var thisId = $(this).attr("data-id");
  $.ajax({
    method: "DELETE",
    url: "/article/" + thisId
  }).done(function (data) {
    window.location = "/articles"
  })
});

$(".showCommentsButton").on("click", function (e) {
  modal.style.display = "block";
  var thisId = $(this).attr("data-id");
  $.ajax({
    method: "GET",
    url: "/note/" + thisId,
  })
    .then(function (data) {
      var $commentContainer = $("#commentsContainer")
      $commentContainer.empty()

      if (data != {}) {
        $commentContainer.append(`<p>${data.body}</b> `)
        $commentContainer.append(`<button data-id="${data._id}" id="commentDeleteButton">Delete</button> `)
        $("#commentDeleteButton").on("click", function (e) {
          modal.style.display = "none";
          var thisId = $(this).attr("data-id");
          $.ajax({
            method: "DELETE",
            url: "/note/" + thisId,
          })
            .then(function (data) {
              window.alert("Comment Deleted")
            })

        })
      }
      else {
        $commentContainer.append(`<p>No Comments</b> `)
      }

    })

})



// When you click the savenote button
$(document).on("click", "#savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

var modal = document.getElementById("modal");

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}