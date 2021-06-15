const express = require('express');
const app = express();
const port = 3000;
const middleware = require('./middleware');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('./database.js');
const session = require('express-session');

const server = app.listen(port, () => console.log("Server listening on port " + port));
const io = require("socket.io")(server, { pingTimeout: 60000 });


app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: "granite for life",
    resave: true,
    saveUninitialized: false
}));


// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const postRoute = require('./routes/postRoutes');
const logoutRoute = require('./routes/logout');
const profileRoute = require('./routes/profileRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require('./routes/searchRoutes');
const messagesRoute = require('./routes/messagesRoutes');
const notificationsRoute = require('./routes/notificationRoutes');


// REST API Routes
const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const chatsApiRoute = require('./routes/api/chats');
const messagesApiRoute = require('./routes/api/messages');
const notificationsApiRoute = require('./routes/api/notifications');

// PAGE
app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/posts", middleware.requireLogin, postRoute);
app.use("/profile", middleware.requireLogin, profileRoute);
app.use("/uploads", uploadRoute );
app.use("/search", middleware.requireLogin, searchRoute );
app.use("/messages", middleware.requireLogin, messagesRoute);
app.use("/notifications", middleware.requireLogin, notificationsRoute);


// REST API
app.use("/api/posts", postsApiRoute);
app.use("/api/users", usersApiRoute);
app.use("/api/chats", chatsApiRoute);
app.use("/api/messages", messagesApiRoute);
app.use("/api/notifications", notificationsApiRoute);



app.get("/", middleware.requireLogin, (req, res, next) => {

    var payload = {
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    }

    res.status(200).render("home", payload);
})

io.on("connection", client => {

    client.on("setup", userData => {
        // Joins the room with the name of the user id
        client.join(userData._id);

        client.emit("connected")
    });

    client.on("join room", room => client.join(room));
    client.on("typing", room => client.in(room).emit("typing"));
    client.on("stop typing", room => client.in(room).emit("stop typing"));
    client.on("notification received", room => client.in(room).emit("notification received"));

    // New message notification to people in group chat
    client.on("new message", newMessage => {
        let chat = newMessage.chat;

        if (!chat.users) return console.log("Chat.users not defined");

        chat.users.forEach(user => {
            if (user._id === newMessage.sender._id) return;
            client.in(user._id).emit("message received", newMessage);
        })
    });


})