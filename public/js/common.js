$('#postTextarea, #replyTextarea').keyup(e => {
  let textbox = $(e.target);
  let value = textbox.val().trim();

  let isModal = textbox.parents(".modal").length === 1;
  let submitBtn = isModal ? $("#submitReplyButton") : $("#submitPostButton");

  if (submitBtn.length === 0) return;

  if (value === "") {
    submitBtn.prop("disabled", true);
    return;
  }

  submitBtn.prop("disabled", false);
});

$("#submitPostButton, #submitReplyButton").click(e => {
  let button = $(e.target);
  let isModal = button.parents(".modal").length === 1;
  let textbox = isModal ? $("#replyTextarea") : $("#postTextarea");

  let data = {
    content: textbox.val(),
  }

  if (isModal) {
    let id = button.data().id;
    if (id === null) return alert("Button id is null");
    data.replyTo = id;
  }

  $.post("/api/posts", data, postData => {
      console.log('postData: ', postData)
    if (postData.replyTo) {
      // Refresh the page after replying to a post
      console.log('in hre?')
      location.reload();
    } else {
      console.log('or here?')
      // Dynamically add post
      let html = createPostHtml(postData);
      $(".postsContainer").prepend(html);
      textbox.val("");
      button.prop("disabled", true)
    }
  });
});

$("#replyModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget);
  let postId = getPostIdFromElement(button);
  $("#submitReplyButton").data('id', postId);

  $.get("/api/posts/" + postId, results => {
    outputPosts(results.postData, $("#originalPostContainer"));
  });
});

$("#replyModal").on("hidden.bs.modal", () => $("#originalPostContainer").html(""));

$("#deletePostModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget);
  let postId = getPostIdFromElement(button);
  $("#deletePostButton").data('id', postId);
});

$("#deletePostButton").click(() => {
  let postId = $(event.target).data("id");

  $.ajax({
    url: `/api/posts/${postId}`,
    type: "DELETE",
    success: (data, status, xhr) => {

      if (xhr.status !== 202) {
        alert("could not delete post");
        return;
      }

      location.reload();
    }
  })

})

$(document).on('click', '.likeButton', (event) => {
  let button = $(event.target);
  let postId = getPostIdFromElement(button);

  if (postId === undefined) return;

  $.ajax({
    url: `/api/posts/${postId}/like`,
    type: "PUT",
    success: (postData) => {
      // Update number without page refresh
      button.find("span").text(postData.likes.length || "");

      if (postData.likes.includes(userLoggedIn._id)) {
        button.addClass("active");
      } else {
        button.removeClass("active");
      }

    }
  })

});

$(document).on('click', '.retweetButton', (event) => {
  let button = $(event.target);
  let postId = getPostIdFromElement(button);

  if (postId === undefined) return;

  $.ajax({
    url: `/api/posts/${postId}/retweet`,
    type: "POST",
    success: (postData) => {
      // Update number without page refresh
      button.find("span").text(postData.retweetUsers.length || "");

      if (postData.retweetUsers.includes(userLoggedIn._id)) {
        button.addClass("active");
      } else {
        button.removeClass("active");
      }

    }
  })
});

$(document).on('click', '.post', event => {
  let element = $(event.target);
  let postId = getPostIdFromElement(element)

  if (postId !== undefined && !element.is("button")) {
    window.location.href = '/posts/' + postId;
  }
})

function getPostIdFromElement(element) {
  let isRoot = element.hasClass('post');
  let rootElement = isRoot ? element : element.closest('.post');
  let postId = rootElement.data().id;

  if (postId === undefined) return alert('Post id undefined');

  return postId;
}

// LargeFont is a reference to whether this is the main post or not
function createPostHtml(postData, largeFont = false) {
  if (postData === null) return alert("post object is null");

  let isRetweet = postData.retweetData !== undefined;
  let retweetedBy = isRetweet ? postData.postedBy.username : null;

  postData = isRetweet ? postData.retweetData : postData;

  // Destructure some variables
  let {postedBy, content, createdAt, _id, ...rest} = postData;
  let {firstName, lastName, username, profilePic} = postedBy;

  if (postedBy._id === undefined) {
    return console.log("user object not populated");
  }

  let displayName = firstName + ' ' + lastName;
  let timestamp = timeDifference(new Date(), new Date(createdAt));

  // Show correct like color on page load
  let likeButtonActiveClass = rest.likes.includes(userLoggedIn._id) ? 'active' : '';
  let retweetButtonActiveClass = rest.retweetUsers.includes(userLoggedIn._id) ? 'active' : '';
  let largeFontClass = largeFont ? "largeFont" : "";

  let retweetText = '';
  if (isRetweet) {
    retweetText = `<span>
      <i class='fas fa-retweet'></i>
      Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
    </span>`
  }

  let replyFlag = '';

  if (postData.replyTo && postData.replyTo._id) {
    if (!postData.replyTo._id) {
      return alert("Reply to is not populated");
    } else if (!postData.replyTo.postedBy._id) {
      return alert("Posted by is not populated");
    }

    let replyToUsername = postData.replyTo.postedBy.username;
    replyFlag = `<div class='replyFlag'>
                    Replying to <a href='/profile/${replyToUsername}' href=''>@${replyToUsername}</a>
                 </div>`
  }

  let buttons = "";
  if (postData.postedBy._id === userLoggedIn._id) {
    buttons = `<button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fas fa-times"></i></button>`;
  }



  return `<div class='post ${largeFontClass}' data-id='${_id}'>
    <div class='postActionContainer'>
      ${retweetText}
    </div>
    <div class='mainContentContainer'>
      <div class='userImageContainer'>
        <img src='${profilePic}'>
      </div>
      <div class='postContentContainer'>
        <div class='header'>
          <a class='displayName' href='/profile/${username}'>${displayName}</a>
          <span class='username'>@${username}</span>
          <span class='date'>${timestamp}</span>
          ${buttons}
        </div>
        ${replyFlag}
        <div class='postBody'>
          <span>${content}</span>
        </div>

        <div class='postFooter'>
          <div class='postButtonContainer'>
            <button data-toggle='modal' data-target='#replyModal'>
              <i class='far fa-comment'></i>
            </button>
          </div>
          <div class='postButtonContainer green'>
            <button class='retweetButton ${retweetButtonActiveClass}'>
              <i class='fas fa-retweet'></i>
              <span>${rest.retweetUsers.length || ''} </span>
            </button>
          </div>
          <div class='postButtonContainer red'>
            <button class='likeButton ${likeButtonActiveClass}'>
              <i class='far fa-heart'></i>
              <span>${rest.likes.length || ''} </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>`;
}

function timeDifference(current, previous) {

  let msPerMinute = 60 * 1000;
  let msPerHour = msPerMinute * 60;
  let msPerDay = msPerHour * 24;
  let msPerMonth = msPerDay * 30;
  let msPerYear = msPerDay * 365;

  let elapsed = current - previous;

  if (elapsed < msPerMinute) {
    if (elapsed / 1000 < 30) return "Just now";
       return Math.round(elapsed/1000) + ' seconds ago';
  }

  if (elapsed < msPerHour) {
       return Math.round(elapsed/msPerMinute) + ' minutes ago';
  }

  if (elapsed < msPerDay ) {
       return Math.round(elapsed/msPerHour ) + ' hours ago';
  }

  if (elapsed < msPerMonth) {
      return Math.round(elapsed/msPerDay) + ' days ago';
  }

  if (elapsed < msPerYear) {
      return Math.round(elapsed/msPerMonth) + ' months ago';
  }

  return Math.round(elapsed/msPerYear ) + ' years ago';

}

function outputPosts(results, container) {
  container.html("");

    if (!Array.isArray(results)) results = [results];

  results.forEach(result => {
    let html = createPostHtml(result);
    container.append(html);
  });

  if (results.length === 0) {
    container.append("<span class='noResults'>Nothing to show.</span>")
  }
}

function outputPostsWithReplies(results, container) {
  container.html("");
  if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
    let html = createPostHtml(results.replyTo);
    container.append(html);
  }

  let mainPostHtml = createPostHtml(results.postData, true);
  container.append(mainPostHtml);

  results.replies.forEach(reply => {
    let html = createPostHtml(reply);
    container.append(html);
  });
}