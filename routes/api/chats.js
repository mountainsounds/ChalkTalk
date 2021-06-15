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
    if (!req.body.users) {
        console.log("Users param not sent with request");
        return res.sendStatus(400);
    }

    let users = JSON.parse(req.body.users);

    if (users.length === 0) {
      console.log('users array is empty!')
      return res.sendStatus(400);
    }

    users.push(req.session.user);

    let chatData = {
      users,
      isGroupChat: true
    }

    Chat.create(chatData).then(chats => res.status(200).send(chats))
    .catch(err => {
      console.log("Oh no!: ", err);
      res.sendStatus(400);
    })

});

router.get('/', async (req, res, next) => {

    Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } }})
    .populate("users")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async (results) => {
      results = await User.populate(results, { path: 'latestMessage.sender' });
      res.status(200).send(results);
    })
    .catch(err => {
      console.log("Oh no!: ", err);
      res.sendStatus(400);
    })
});

router.get('/:chatId', async (req, res, next) => {

  Chat.findOne({ _id: req.params.chatId, users: { $elemMatch: { $eq: req.session.user._id } }})
  .populate("users")
  .then(results => res.status(200).send(results))
  .catch(err => {
    console.log("Oh no!: ", err);
    res.sendStatus(400);
  })
});

router.put('/:chatId', async (req, res, next) => {

  Chat.findByIdAndUpdate(req.params.chatId, req.body)
  .then(results => res.sendStatus(204))
  .catch(err => {
    console.log("Oh no!: ", err);
    res.sendStatus(400);
  })
});

router.get('/:chatId/messages', async (req, res, next) => {

  Message.find({ chat: req.params.chatId })
  .populate("sender")
  .then(results => res.status(200).send(results))
  .catch(err => {
    console.log("Oh no!: ", err);
    res.sendStatus(400);
  })
});



module.exports = router;

