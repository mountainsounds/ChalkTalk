let connected = false;
let path = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;

let socket = io(path);
socket.emit("setup", userLoggedIn);

socket.on("connected", () => connected = true);
socket.on("message received", newMessage => messageReceived(newMessage));

socket.on("notification received", () => {
    $.get("/api/notifications/latest", (notificationData) => {
      showNotificationPopup(notificationData);
        refreshNotificationsBadge();
    });
});

function emitNotification(userId) {
  if (userId === userLoggedIn._id) return;

  socket.emit("notification received", userId);
}
