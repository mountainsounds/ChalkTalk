const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User'},
    content: { type: String, trim: true },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat'},
    readBy: [ {type: Schema.Types.ObjectId, ref: 'User'} ]
// Set Options
}, { timestamps: true});

module.exports = mongoose.model('Message', messageSchema);