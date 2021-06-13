const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema.js');
const Post = require('../../schemas/PostSchema.js');
const Chat = require('../../schemas/ChatSchema.js');

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


module.exports = router;

