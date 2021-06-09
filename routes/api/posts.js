const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema.js');
const Post = require('../../schemas/PostSchema.js');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res, next) => {
  Post.find()
  .populate("postedBy")
  .sort({ "createdAt": -1 })
  .then(results => res.status(200).send(results))
  .catch(err => {
    console.log('Oh no!: ', error);
    res.sendStatus(400);
  })
});

router.post('/', async (req, res, next) => {
  if (!req.body.content) {
    console.log('Content param not sent with request');
    return res.sendStatus(400)
  }

  let postData = {
    content: req.body.content,
    postedBy: req.session.user,
  }

  Post.create(postData)
    .then(async newPost => {
      newPost = await User.populate(newPost, { path: "postedBy" })
      res.status(201).send(newPost);
    }).catch(err => {
      console.log('Oh no!: ', err);
      // Possibly refactor later to handle more gracefully by sending user an error message.
      res.sendStatus(400);
    })
});

router.put('/:id/like', async (req, res, next) => {
  let postId = req.params.id;
  let userId = req.session.user._id;

  // Make sure likes array is actually there before checking if it has been liked
  let isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

  let option = isLiked ? '$pull' : '$addToSet';

  // Insert or remove user like
  req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, {
    new: true}).catch(err => {
      console.log('Oh no!: ', err);
      res.sendStatus(400);
    })

  // Insert post like
  let post = await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, {
    new: true}).catch(err => {
      console.log('Oh no!: ', err);
      res.sendStatus(400);
    });

 res.status(200).send(post);
});

module.exports = router;

