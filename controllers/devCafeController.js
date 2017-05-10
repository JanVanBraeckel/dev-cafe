const mongoose = require('mongoose');
const request = require('request');
const Topic = mongoose.model('Topic');

exports.createTopic = async (req, res) => {
  const topic = await (new Topic({ name: req.body.text })).save();
  res.status(200).json({
    text: `Created topic ${topic.name}`
  });
};

exports.startVote = (req, res) => {
  Topic.findRandom({}, {}, { limit: 4 }, function (err, topics) {
    let text = '';
    const mapped = topics.map((topic, index) => {
      text += `${index + 1}. ${topic.name}\n`;
      return {
        name: 'topic',
        type: 'button',
        value: topic._id,
        text: index + 1
      };
    });
    res.status(200).json({
      response_type: 'in_channel',
      text: 'Let\'s vote for a topic!',
      attachments: [{
        text,
        callback_id: 'vote',
        actions: mapped
      }]
    });
  });
};

exports.vote = (req, res) => {
  const payload = JSON.parse(req.body.payload);
  console.log(JSON.stringify(payload));
  request({
    method: 'POST',
    url: payload.response_url,
    json: true,
    body: {
      text: 'neat'
    }
  }, (error, resp, body) => {
    res.status(200).send();
  });
}