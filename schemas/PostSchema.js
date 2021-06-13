const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  // Don't require the content to be true, to handle retweeting posts later on.
  content: { type: String, trim: true},
  postedBy: { type: Schema.Types.ObjectId, ref: 'User'},
  pinned: Boolean,
  // Keep track of all of the users who have liked a post
  likes: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  retweetUsers: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  retweetData: { type: Schema.Types.ObjectId, ref: 'Post'},
  replyTo: { type: Schema.Types.ObjectId, ref: 'Post'},
  pinned: Boolean,

// Set Options
}, {
  // Give timestamp to each insertion
  timestamps: true
});

let Post = mongoose.model('Post', PostSchema);
module.exports = Post;