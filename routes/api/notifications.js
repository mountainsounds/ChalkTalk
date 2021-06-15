const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema.js');
const Post = require('../../schemas/PostSchema.js');
const Chat = require('../../schemas/ChatSchema.js');
const Message = require('../../schemas/MessageSchema.js');
const Notification = require('../../schemas/NotificationSchema.js');


app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', async (req, res, next) => {
    Notification.find({ userTo: req.session.user._id, notificationType: { $ne: "newMessage" } })
    .populate("userTo")
    .populate("userFrom")
    .sort({ createdAt: -1 })
    .then(results => res.status(200).send(results))
    .catch(err => {
      console.log("Oh no!: ", err);
      res.sendStatus(400);
    })
});

router.put('/:id/markAsOpened', async (req, res, next) => {
  Notification.findByIdAndUpdate(req.params.id, {opened: true})
  .then(() => res.sendStatus(204))
  .catch(err => {
    console.log("Oh no!: ", err);
    res.sendStatus(400);
  })
});

router.put('/markAsOpened', async (req, res, next) => {
  Notification.updateMany({ userTo: req.session.user._id }, {opened: true})
  .then(() => res.sendStatus(204))
  .catch(err => {
    console.log('Problem?')
    console.log("Oh no!: ", err);
    res.sendStatus(400);
  })
});




module.exports = router;

