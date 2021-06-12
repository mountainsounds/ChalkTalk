const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true, unique: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "/images/profilePic.png" },
  coverPhoto: { type: String },
  // Keep track of posts the user has liked
  likes: [{ type: Schema.Types.ObjectId, ref: 'Post'}],
  retweets: [{ type: Schema.Types.ObjectId, ref: 'Post'}],
  following: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User'}]
// Set Options
}, {
  // Give timestamp to each insertion
  timestamps: true
});

let User = mongoose.model('User', UserSchema);
module.exports = User;