// Global Bindings
let cropper;
let timer;
let selectedUsers = [];
// let cropping = false;

$(document).ready(() => {
    refreshMessagesBadge();
    refreshNotificationsBadge();
});


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
    if (postData.replyTo) {
      emitNotification(postData.replyTo.postedBy)
      // Refresh the page after replying to a post
      location.reload();
    } else {
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

$("#confirmPinModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget);
  let postId = getPostIdFromElement(button);
  $("#pinPostButton").data('id', postId);
});

$("#unpinModal").on("show.bs.modal", (event) => {
  let button = $(event.relatedTarget);
  let postId = getPostIdFromElement(button);
  $("#unpinPostButton").data('id', postId);
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

$("#pinPostButton").click(() => {
  let postId = $(event.target).data("id");

  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: true },
    success: (data, status, xhr) => {

      if (xhr.status !== 204) {
        alert("could not pin post");
        return;
      }

      location.reload();
    }
  })

})

$("#unpinPostButton").click(() => {
  let postId = $(event.target).data("id");

  $.ajax({
    url: `/api/posts/${postId}`,
    type: "PUT",
    data: { pinned: false },
    success: (data, status, xhr) => {

      if (xhr.status !== 204) {
        alert("could not pin post");
        return;
      }

      location.reload();
    }
  })

})

$("#filePhoto").change(event => {
    let input = $(event.target)[0];

    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = (e) => {
            let image = document.getElementById("imagePreview");
            image.src = e.target.result;


            if (cropper !== undefined) {
              cropper.destroy();
            }

            cropper = new Cropper(image, {
              aspectRatio: 1 / 1,
              // Prevents the grid background while cropping
              background: false
            });

        }
      reader.readAsDataURL(input.files[0]);
    }
});


// $("#coverPhoto").on('hide.bs.modal', (e) => {
//   console.log("Fired!!: ", cropping);
//   if (cropping) return false
// });

$("#coverPhoto").change(event => {
  let input = $(event.target)[0];
  if (input.files && input.files[0]) {
      if (input.files[0].size > 1000000) {
          alert(`file is larger than 1 mb, please choose a smaller one.`)
      } else {
          let reader = new FileReader();
          reader.onload = (e) => {
              let image = document.getElementById("coverPreview");
              image.src = e.target.result;

              if (cropper !== undefined) {
                  cropper.destroy();
              }

              cropper = new Cropper(image, {
                  aspectRatio: 16 / 9,
                  // Prevents the grid background while cropping
                  background: false
            });
          }

          reader.readAsDataURL(input.files[0]);
      }
  }
});

$("#imageUploadButton").click(() => {
    let canvas = cropper.getCroppedCanvas();

    if (canvas === null) {
      alert("Could not upload image. Make sure it is an image file.");
      return;
    }

    // Blob will help store large videos / photos (binary large object)
    canvas.toBlob(blob => {
      let formData = new FormData();
      formData.append("croppedImage", blob);

      $.ajax({
        url: "/api/users/profilePicture",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: () => location.reload()
      })

    })

});

$("#coverPhotoButton").click(() => {
  let canvas = cropper.getCroppedCanvas();

  if (canvas === null) {
    alert("Could not upload image. Make sure it is an image file.");
    return;
  }

  // Blob will help store large videos / photos (binary large object)
  canvas.toBlob(blob => {
    let formData = new FormData();
    formData.append("croppedImage", blob);

    $.ajax({
      url: "/api/users/coverPhoto",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: () => location.reload(),
      error: (err) => console.log('Err: ', err),
    });

  })

});

$("#userSearchTextbox").keydown((e) => {
  clearTimeout(timer);
  let textbox = $(e.target);
  let value = textbox.val();

      // remove user from selection (8 is the delete kCode)
      // e.keyCode has been deprecated
  if (value === "" && (e.which === 8 || e.keyCode === 8)) {
    selectedUsers.pop();
    updateSelectedUsersHtml();
    $(".resultsContainer").html("");

    if (selectedUsers.length === 0) $("#createChatButton").prop("disabled", true);
    return;
  }

  timer = setTimeout(() => {
    value = textbox.val().trim();

    if (value === "") {
        $(".resultsContainer").html("");
    } else {
      searchUsers(value);
    }
  }, 500)
});

$("#createChatButton").click(() => {
    let data = JSON.stringify(selectedUsers);
    $.post("/api/chats", { users: data }, chat => {
        if (!chat || !chat._id) {
          // refector later to display a nicer alert
          return alert("Invalid response from server.")
        }
        window.location.href = `/messages/${chat._id}`;
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
      // Update number without page refresh
      button.find("span").text(postData.likes.length || "");

      if (postData.likes.includes(userLoggedIn._id)) {
        button.addClass("active");
        emitNotification(postData.postedBy);
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
        emitNotification(postData.postedBy);
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
});

$(document).on('click', '.followButton', event => {
  let button = $(event.target);
  let userId = button.data().user;

  $.ajax({
    url: `/api/users/${userId}/follow`,
    type: "PUT",
    success: (data, status, xhr) => {
      if (xhr.status === 404) {
        // User was not found, return for now, create an alert for user later
        return;
      }

      let difference = 1;

      if (data.following && data.following.includes(userId)) {
        button.addClass("following");
        button.text("Following");
        emitNotification(userId);
      } else {
        button.removeClass("following");
        button.text("Follow");
        difference -= 1;
      }

      let followersLabel = $("#followersValue");
      if (followersLabel.length !== 0) {
          let followersText = +followersLabel.text();
          followersLabel.text(difference);
      }

    }
  })

});

$(document).on("click", ".notification.active", (e) => {
    let container = $(e.target);
    let notificationId = container.data().id;

    let href = container.attr("href");
    e.preventDefault();

    let callback = () => window.location = href;
    markNotificationsAsOpened(notificationId, callback);
});

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
  let pinnedPostText = "";

  if (postData.postedBy._id === userLoggedIn._id) {

    let pinnedClass = "";
    let dataTarget = "#confirmPinModal";

    if (postData.pinned === true) {
      pinnedClass = "active";
      dataTarget = "#unpinModal"
      pinnedPostText = "<i class'fas fa-thumbtack'></i><span>Pinned post</span>"
    }

    buttons = `<button class='pinButton ${pinnedClass}' data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}"><i class="fas fa-thumbtack"></i></button>
    <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fas fa-times"></i></button>`;
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
        <div class='pinnedPostText'>${pinnedPostText}</div>
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

function outputUsers(results, container) {
  container.html("");
  results.forEach(result => {
    console.log(result.firstName);

    let html = createUserHtml(result, true);
    container.append(html);
  });

  if (results.length === 0) {
    container.append("<span class='noResults'>No results found</span>")
  }
}

function createUserHtml(userData, showFollowButton) {
  let name = userData.firstName + " " + userData.lastName;
  let isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);

  let text = isFollowing ? "Following" : "Follow"
  let buttonClass = isFollowing ? "followButton following" : "followButton"

  let followButton = "";
  if (showFollowButton && userLoggedIn._id !== userData._id) {
      followButton = `<div class='followButtonContainer'>
                        <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                      </div>`;
  }

  return `<div class='user'>
              <div class='userImageContainer'>
                  <img src='${userData.profilePic}'>
              </div>
              <div class='userDetailsContainer'>
                  <div class='header'>
                      <a href='/profile/${userData.username}'>${name}</a>
                      <span class='username'>@${userData.username}</span>
                  </div>
              </div>
              ${followButton}
          </div>
  `;

}

function searchUsers (searchTerm) {
    $.get("/api/users", {search: searchTerm}, results => {
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}

function outputSelectableUsers(results, container) {
    container.html("");
    results.forEach(user => {
      // don't search for self or already added user
        if (user._id === userLoggedIn._id || selectedUsers.some(usr => usr._id === user._id)) {
          return;
        }

        let html = createUserHtml(user, false);
        let element = $(html);
        container.append(element);
        element.click(() => userSelected(user));
    });

    if (results.length === 0) {
        container.append("<span class='noResults'>No results found</span>")
    }
}

function userSelected(user) {
    selectedUsers.push(user);
    updateSelectedUsersHtml();
    $("#userSearchTextbox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

function updateSelectedUsersHtml() {
  let elements = [];
  selectedUsers.forEach(user => {
    let name = user.firstName + " " + user.lastName;
    let userElement = $(`<span class='selectedUser'>${name}</span>`);
    elements.push(userElement);
  })

  $(".selectedUser").remove();
  $("#selectedUsers").prepend(elements);
}

function getChatName(chatData) {
  let chatName = chatData.chatName;

  if (!chatName) {
      let otherChatUsers = getOtherChatUsers(chatData.users);
      let namesArray = otherChatUsers.map(user => user.firstName + " " + user.lastName);
      chatName = namesArray.join(", ")
  }

  return chatName;
}

function getOtherChatUsers(users) {
if (users.length === 1) return users;

return users.filter(user => user._id !== userLoggedIn._id);
}

function messageReceived(newMessage) {
  if ($(`[data-room="${newMessage.chat._id}"]`).length === 0) {
    // Show popup notification (not currently on message page)
      showMessagePopup(newMessage)
  } else {
      addChatMessageHtml(newMessage);
      markAllMessagesAsRead();
  }
  // Update badge after new messages are sent.
  refreshMessagesBadge();
}

function markNotificationsAsOpened(notificationId = null, callback = null) {
    if (callback === null) callback = () => location.reload();

    let endpoint = notificationId !== null ? `${notificationId}/markAsOpened` : 'markAsOpened';

    $.ajax({
      url: `/api/notifications/` + endpoint,
      type: 'PUT',
      success: callback,
    });
}

function refreshMessagesBadge() {
    $.get("/api/chats", { unreadOnly: true }, (messages) => {
      let badge = $("#messagesBadge");
      let numMessages = messages.length;
       numMessages > 0 ? badge.text(numMessages).addClass("active") : badge.text("").removeClass("active");
    });
}

function refreshNotificationsBadge() {
  $.get("/api/notifications", { unreadOnly: true }, (notifications) => {
    let badge = $("#notificationsBadge");
    let numNotifications = notifications.length;
     numNotifications > 0 ? badge.text(numNotifications).addClass("active") : badge.text("").removeClass("active");
  });
}

function showNotificationPopup(data) {
  let html = createNotificationHtml(data);
  let element = $(html);
  // For slide down effect to work we first need to hide it as it is a visible element already showing
  element.hide().prependTo("#notificationList").slideDown("fast");

  setTimeout(() => element.fadeOut(400), 5000);
}

function showMessagePopup(data) {
  if (!data.chat.latestMessage._id) {
    data.chat.latestMessage = data;
  }

  let html = createChatHtml(data.chat);
  let element = $(html);
  // For slide down effect to work we first need to hide it as it is a visible element already showing
  element.hide().prependTo("#notificationList").slideDown("fast");

  setTimeout(() => element.fadeOut(400), 5000);
}

function outputNotificationList(notifications, container) {
  notifications.forEach(notification => {
    let html = createNotificationHtml(notification);
    container.append(html);
  })

  if (notifications.length === 0) {
      container.append("<span class=noResults'>Nothing to show.</span>");
  }
}

function createNotificationHtml(notification) {
  let userFrom = notification.userFrom;
  let text = getNotificationText(notification);
  let href = getNotificationUrl(notification);
  let className = notification.opened ? "" : 'active'

  return `<a href='${href}' class='resultListItem notification ${className}' data-id='${notification._id}'>
              <div class='resultsImageContainer'>
                  <img src='${userFrom.profilePic}'>
              </div>
              <div class='resultsDetailsContainer ellipsis'>
                  <span class='ellipsis'>${text}</span>
              </div>
          </a>`
}

function getNotificationText({userFrom, notificationType}) {
    if (!userFrom.firstName || !userFrom.lastName) {
        return alert("user from data not populated");
    }

    let userFromName = `${userFrom.firstName} ${userFrom.lastName}`;

    let options = {
      'retweet': `retweeted one of your posts`,
      'postLike': `liked one of your posts`,
      'reply': `replied one of your posts`,
      'follow': `followed you`,
    }

    return `<span class='elipsis'>${userFromName} ${options[notificationType]}</span>`
}

function getNotificationUrl({userFrom, notificationType, entityId}) {
  if (notificationType === "retweet" || notificationType === "postLike" || notificationType === "reply") {
      return `/posts/${entityId}`;
  }
  return notificationType === "follow" ? `/profile/${entityId}` : "#"
}

function createChatHtml(chatData) {
  let chatName =getChatName(chatData);
  let image = getChatImageElements(chatData);
  let latestMessage = getLatestMessage(chatData.latestMessage);

  let activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active";

  return `<a class='resultListItem ${activeClass}' href='/messages/${chatData._id}'>
              ${image}
              <div class='resultsDetailsContainer ellipsis'>
                  <span class='heading ellipsis'>${chatName}</span>
                  <span class='subText ellipsis'>${latestMessage}</span>

              </div>
          </a>`;
}


function getChatImageElements(chatData) {
let otherChatUsers = getOtherChatUsers(chatData.users);

let groupChatClass = "";

let chatImage = getUserChatImageElement(otherChatUsers[0]);

// if more than one other person in chat, add multiple photos
if (otherChatUsers.length > 1) {
  groupChatClass = "groupChatImage";
  chatImage += getUserChatImageElement(otherChatUsers[1]);
}

return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

function getUserChatImageElement(user) {
if (!user || !user.profilePic) {
    return alert("User passed into function is invalid");
}

return `<img src='${user.profilePic}' alt='User's profile pic'>`;
}

function getLatestMessage(latestMessage) {
  if (latestMessage !== null && latestMessage !== undefined) {
      let sender = latestMessage.sender;
      return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
  }

  return "New chat";
}