const mongoose = require('mongoose');
const random = require('mongoose-simple-random');
mongoose.Promise = global.Promise;

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a topic name!',
    required: true,
  },
  description: {
    type: String,
    trim: true
  }
});

topicSchema.plugin(random);

module.exports = mongoose.model('Topic', topicSchema);
