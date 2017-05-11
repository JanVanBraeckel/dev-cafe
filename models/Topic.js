const mongoose = require('mongoose');
const random = require('mongoose-simple-random');
mongoose.Promise = global.Promise;

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    required: 'Please enter a topic name!',
  },
  description: {
    type: String,
    trim: true
  },
  chosen: {
    type: Boolean,
    default: false
  }
});

topicSchema.plugin(random);

module.exports = mongoose.model('Topic', topicSchema);
