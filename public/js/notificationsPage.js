$(document).ready(() => {
  $.get("/api/notifications", (notifications) => {
      outputNotificationList(notifications, $('.resultsContainer'));
  });
});

$("#markNotificationsAsRead").click(() => markNotificationsAsOpened());

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