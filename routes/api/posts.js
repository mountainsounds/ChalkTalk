const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema.js');
const Post = require('../../schemas/PostSchema.js');

app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', async (req, res, next) => {
  let searchObj = req.query;
  let sessionUser = req.session.user;

  if (searchObj.isReply !== undefined) {
    let isReply = searchObj.isReply === "true";
    // Mongodb exists operator to determine whether the search term exists
    searchObj.replyTo = { $exists: isReply };
    delete searchObj.isReply;
  }

  if (searchObj.search !== undefined) {
    // This handles the specific searchBar filtering logic
    searchObj.content = { $regex: searchObj.search, $options: "i"};
    delete searchObj.search;
  }

  if (searchObj.followingOnly !== undefined) {
    let followingOnly = searchObj.followingOnly === "true";

    if (followingOnly) {
      let objectIds = [];

      if (!sessionUser.following) {
        sessionUser.following = [];
      }

      sessionUser.following.forEach(user => {
        objectIds.push(user);
      })
      // This line will show our own posts on the newsFeed line
      objectIds.push(sessionUser._id);
      searchObj.postedBy = { $in: objectIds };
    }

    delete searchObj.followingOnly;
  }

  let results = await getPosts(searchObj);
  res.status(200).send(results);
});

router.get('/:id', async (req, res, next) => {
  let postId = req.params.id;
  let postData = await getPosts({ _id: postId});

  postData = postData[0];

  let results = {
    postData,
  }

  if (postData.replyTo !== undefined) {
    results.replyTo = postData.replyTo
  }

  results.replies = await getPosts({ replyTo: postId })

  res.status(200).send(results);
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

  if (req.body.replyTo) {
    postData.replyTo = req.body.replyTo;
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

router.post('/:id/retweet', async (req, res, next) => {
  let postId = req.params.id;
  let userId = req.session.user._id;

  // Try and delete retweet
  let deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId })
  .catch(err => {
    console.log(error);
    res.sendStatus(400);
  })

  let option = deletedPost !== null ? "$pull" : "$addToSet";
  let repost = deletedPost;

  if (repost === null) {
    repost = await Post.create({ postedBy: userId, retweetData: postId})
    .catch(err => {
      console.log(error);
      res.sendStatus(400);
    })
  }



  req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: repost._id } }, { new: true}).catch(err => {
      console.log('Oh no!: ', err);
      res.sendStatus(400);
    })

  // Update Post
  let post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, {
    new: true}).catch(err => {
      console.log('Oh no!: ', err);
      res.sendStatus(400);
    });

 res.status(200).send(post);
});

router.delete("/:id", (req, res, next) => {
  Post.findByIdAndDelete(req.params.id)
  .then(() => res.sendStatus(202))
  .catch(err => {
    console.log(error);
    res.sendStatus(400);
  })
});

router.put("/:id", async (req, res, next) => {

  if (req.body.pinned !== undefined) {
      await Post.updateMany({ postedBy: req.session.user }, { pinned: false })
      .catch(err => {
        console.log(error);
        res.sendStatus(400);
      })
  }


  Post.findByIdAndUpdate(req.params.id, req.body)
  .then(() => res.sendStatus(204))
  .catch(err => {
    console.log(error);
    res.sendStatus(400);
  })
});



async function getPosts(filter) {
  let results = await Post.find(filter)
  .populate("postedBy")
  .populate("retweetData")
  .populate("replyTo")
  .sort({ "createdAt": -1 })
  .catch(err => console.log('Oh no!: ', error));

  results = await User.populate(results, { path: "replyTo.postedBy"});

  return await User.populate(results, { path: "retweetData.postedBy"});
}


module.exports = router;

