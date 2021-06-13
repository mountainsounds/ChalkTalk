const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../schemas/UserSchema.js');
const Chat = require('../schemas/ChatSchema.js');



router.get('/', (req, res, next) => {
    res.status(200).render("inboxPage", {
      pageTitle: "Inbox",
      userLoggedIn: req.session.user,
      userLoggedInJs: JSON.stringify(req.session.user),
    });
});

router.get("/new", (req, res, next) => {
  res.status(200).render("newMessage", {
    pageTitle: "New message",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  });
});

router.get("/:chatId", async (req, res, next) => {

  let userId = req.session.user._id;
  let chatId = req.params.chatId;
  let isValidId = mongoose.isValidObjectId(chatId);

  let payload = {
    pageTitle: "Chat",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };

  if (!isValidId) {
    payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
    return res.status(200).render("chatPage", payload);
  }

  // This makes sure that the user actually belongs to the chat
  let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
  .populate("users");

  // If we did not find a chat,
  if (chat === null) {
    // check if chat id is really user id
    let userFound = await User.findById(chatId);

    if (userFound !== null) {
      // Get chat using userId
      chat = await getChatByUserId(userFound._id, userId);
    }
  }

  if (chat === null) {
      // Chat does not exist or User is not allowed to see it
      payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
      return res.status(200).render("chatPage", payload);
  } else {
    payload.chat = chat;
  }

  res.status(200).render("chatPage", payload);
});

function getChatByUserId(userLoggedInId, otherUserId ) {
    return Chat.findOneAndUpdate({
      isGroupChat: false,
      users: {
        $size: 2,
        $all: [
          { $elemMatch: { $eq: mongoose.Types.ObjectId(userLoggedInId) }},
          { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) }}
        ]
      }
    }, {
      // If the query above does not find anything, stuff below will be created
      $setOnInsert: {
        users: [userLoggedInId, otherUserId]
      }
    }, {
      // Options
      new: true,
      upsert: true
    })
    .populate("users");
}

module.exports = router;

