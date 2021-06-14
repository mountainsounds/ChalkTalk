const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema.js');
const Post = require('../../schemas/PostSchema.js');
const Chat = require('../../schemas/ChatSchema.js');
const Message = require('../../schemas/MessageSchema.js');

app.use(bodyParser.urlencoded({ extended: false }));

router.post('/', async (req, res, next) => {
    if (!req.body.content || !req.body.chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    let newMessage = {
      sender: req.session.user._id,
      content: req.body.content,
      chat: req.body.chatId,
    };

    Message.create(newMessage)
    .then(message => {
      res.status(201).send(message);
    }).catch(err => {
      console.log("Oh no!: ", err);
      res.sendStatus(400);
    })


});



module.exports = router;

