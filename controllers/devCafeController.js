const mongoose = require('mongoose');
const request = require('request');
const Topic = mongoose.model('Topic');
const Vote = mongoose.model('Vote');

exports.createTopic = async (req, res) => {
  const topic = await (new Topic({ name: req.body.text })).save();
  res.status(200).json({
    text: `Created topic ${topic.name}`
  });
};

exports.close = async (req, res) => {
  const vote = await Vote.findOne({ finished: false });
  if (vote) {
    const topics = vote.topics.sort((a, b) => b.votedby.length - a.votedby.length);
    const chosen = topics[0];
    const topic = await Topic.findById(chosen._id);
    topic.chosen = true;
    vote.finished = true;
    await Topic.findByIdAndUpdate(topic._id, topic);
    await Vote.findByIdAndUpdate(vote._id, vote);
    res.status(200).json({
      response_type: 'in_channel',
      text: `<!channel> Voting has closed! Topic ${topic.name} has won with ${chosen.votedby.length} votes. Thank you for voting for this topic ${chosen.votedby.join(', ')}!`,
    });
  } else {
    res.status(200).json({
      response_type: 'in_channel',
      text: 'No voting is currently open, start a new vote with /cafevote!',
    });
  }
};

exports.startVote = async (req, res) => {
  const existingVote = await tryGetExistingVote();
  if (existingVote) {
    await resendVote(req, res, existingVote);
  } else {
    const topics = await findRandomTopics(4);
    if (topics && topics.length > 0) {
      const vote = await (new Vote({ topics: topics.map(topic => { return { _id: topic._id } }) })).save();
      let text = '';
      const mapped = topics.map((topic, index) => {
        text += `${index + 1}. ${topic.name} (0 vote(s))\n`;
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
          callback_id: vote._id,
          actions: mapped
        }]
      });
    } else {
      res.status(200).json({
        response_type: 'in_channel',
        text: 'There are currently no topics available, add some more!'
      });
    }
  }
};

exports.vote = async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const vote = await Vote.findById(payload.callback_id);
  vote.topics.forEach(el => {
    if (el._id.toString() === payload.actions[0].value) {
      let votedby = el.votedby;
      votedby.push(payload.user.name);
      el.votedby = votedby.filter((el, pos, arr) => arr.indexOf(el) == pos);
    }
  });
  await Vote.findByIdAndUpdate(payload.callback_id, vote);
  let message = payload.original_message;
  let map = new Map();
  message.attachments[0].actions = await Promise.all(vote.topics.map(async (topic, index) => {
    const dbTopic = await Topic.findById(topic._id);
    map.set(index, `${index + 1}. ${dbTopic.name} (${topic.votedby.length} vote(s))`);
    return {
      name: 'topic',
      type: 'button',
      value: topic._id,
      text: index + 1
    };
  }));
  let text = '';
  new Map([...map.entries()].sort()).forEach((value) => text += `${value}\n`);
  message.attachments[0].text = text;
  message.attachments[0].mrkdwn = true;
  request({
    method: 'POST',
    url: payload.response_url,
    json: true,
    body: message
  }, (error, resp, body) => {
    res.status(200).send();
  });
};

const resendVote = async (req, res, existingVote) => {
  const topics = await Topic.find({
    '_id': {
      $in: existingVote.topics
    }
  });
  let text = '';
  const mapped = existingVote.topics.map((topic, index) => {
    text += `${index + 1}. ${topics.find(top => top._id.toString() === topic._id.toString()).name} (${topic.votedby.length} vote(s))\n`;
    return {
      name: 'topic',
      type: 'button',
      value: topic._id,
      text: index + 1
    };
  });
  res.status(200).json({
    response_type: 'in_channel',
    text: 'There\'s already a voting going on! Continue voting here or finish the vote!',
    attachments: [{
      text,
      callback_id: existingVote._id,
      actions: mapped
    }]
  });
};

const findRandomTopics = (amount = 4) => {
  return new Promise((resolve, reject) => {
    Topic.findRandom({ chosen: false }, {}, { limit: amount }, function (err, topics) {
      if (!err) {
        resolve(topics);
      } else {
        reject(err);
      }
    });
  });
};

const tryGetExistingVote = async () => {
  return await Vote.findOne({ finished: false });
};