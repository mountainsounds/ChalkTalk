$('#postTextarea').keyup(e => {
  let textbox = $(e.target);
  let value = textbox.val().trim();
  let submitBtn = $("#submitPostButton");

  if (submitBtn.length === 0) return;

  if (value === "") {
    submitBtn.prop("disabled", true);
    return;
  }

  submitBtn.prop("disabled", false);
});

$("#submitPostButton").click(e => {
  let btn = $(e.target);
  let textbox = $("#postTextarea");

  let data = {
    content: textbox.val(),
  }

  $.post("/api/posts", data, postData => {
    let html = createPostHtml(postData);
    $(".postsContainer").prepend(html);
    textbox.val("");
    btn.prop("disabled", true)
  })
});

$(document).on('click', '.likeButton', (event) => {
  let button = $(event.target);
  let postId = getPostIdFromElement(button);

  if (postId === undefined) return;

  $.ajax({
    url: `/api/posts/${postId}/like`,
    type: "PUT",
    success: (postData) => {
      console.log(postData.likes.length);
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

function getPostIdFromElement(element) {
  let isRoot = element.hasClass('post');
  let rootElement = isRoot ? element : element.closest('.post');
  let postId = rootElement.data().id;

  if (postId === undefined) return alert('Post id undefined');

  return postId;
}

function createPostHtml({postedBy, content, createdAt, _id, ...rest}) {
  if (postedBy._id === undefined) {
    return console.log("user object not populated");
  }

  let {firstName, lastName, username, profilePic} = postedBy;

  let displayName = firstName + ' ' + lastName;
  let timestamp = timeDifference(new Date(), new Date(createdAt));

  // Show correct like color on page load
  let likeButtonActiveClass = rest.likes.includes(userLoggedIn._id) ? 'active' : '';

  return `<div class='post' data-id='${_id}'>
    <div class='mainContentContainer>
      <div class='userImageContainer'>
        <img src='${profilePic}'>
      </div>
      <div class='postContentContainer'>
        <div class='header'>
          <a class='displayName' href='/profile/${username}'>${displayName}</a>
          <span class='username'>@${username}</span>
          <span class='date'>${timestamp}</span>
        </div>
        <div class='postBody'>
          <span>${content}</span>
        </div>

        <div class='postFooter'>
          <div class='postButtonContainer'>
            <button><i class='far fa-comment'></i></button>
          </div>
          <div class='postButtonContainer green'>
            <button class='retweet'>
              <i class='fas fa-retweet'></i>
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