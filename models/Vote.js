const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const topicsSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  votedby: {
    type: Array
  }
});

const voteSchema = new mongoose.Schema({
  topics: [topicsSchema],
  finished: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Vote', voteSchema);
