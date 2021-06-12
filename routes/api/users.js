const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema.js');
const Post = require('../../schemas/PostSchema.js');

app.use(bodyParser.urlencoded({ extended: false }));

router.put('/:userId/follow', async (req, res, next) => {

  let userId = req.params.userId;

  let user = await User.findById(userId);

  if (user === null) res.sendStatus(404);

  let isFollowing = user.followers && user.followers.includes(req.session.user._id);

  let option = isFollowing ? "$pull" : "$addToSet";

  req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [option] : {following: userId }}, {new: true})
  .catch(err => {
    console.log("Oh no!: ", err);
    res.sendStatus(400);
  })

  User.findByIdAndUpdate(userId, { [option] : {followers: req.session.user._id } })
  .catch(err => {
    console.log("Oh no!: ", err);
    res.sendStatus(400);
  })


  res.status(200).send(req.session.user);


});

router.get('/:userId/following', async (req, res, next) => {
  User.findById(req.params.userId)
  .populate("following")
  .then(results => {
    res.status(200).send(results);
  })
  .catch(err => {
    console.log("Oh no!: ", err)
    res.sendStatus(400);
  })

});

router.get('/:userId/followers', async (req, res, next) => {
  User.findById(req.params.userId)
  .populate("followers")
  .then(results => {
    res.status(200).send(results);
  })
  .catch(err => {
    console.log("Oh no!: ", err)
    res.sendStatus(400);
  })

});

module.exports = router;

