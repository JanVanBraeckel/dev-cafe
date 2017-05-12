const mongoose = require('mongoose');
const request = require('request');
const Topic = mongoose.model('Topic');
const Vote = mongoose.model('Vote');

exports.createTopic = (req, res) => {
  const topic = (new Topic({ name: req.body.text })).save().then((topic) => res.status(200).json({
    text: `Created topic ${topic.name}`
  }));
};

exports.close = (req, res) => {
  Vote.findOne({ finished: false }).then((vote) => {
    if (vote) {
      const topics = vote.topics.sort((a, b) => b.votedby.length - a.votedby.length);
      const chosen = topics[0];
      Topic.findById(chosen._id).then((topic) => {
        topic.chosen = true;
        vote.finished = true;
        let topicPromise = Topic.findByIdAndUpdate(topic._id, topic);
        let votePromise = Vote.findByIdAndUpdate(vote._id, vote);
        Promise.all([topicPromise, votePromise]).then(() => res.status(200).json({
          response_type: 'in_channel',
          text: `<!channel> Voting has closed! Topic ${topic.name} has won with ${chosen.votedby.length} votes. Thank you for voting for this topic ${chosen.votedby.join(', ')}!`,
        }));
      });
    } else {
      res.status(200).json({
        response_type: 'in_channel',
        text: 'No voting is currently open, start a new vote with /cafevote!',
      });
    }
  });
};

exports.startVote = (req, res) => {
  tryGetExistingVote().then((existingVote) => {
    if (existingVote && existingVote.length > 0) {
      resendVote(req, res, existingVote[0]);
    } else {
      findRandomTopics(4).then((topics) => {
        if (topics && topics.length > 0) {
          (new Vote({ topics: topics.map(topic => { return { _id: topic._id } }) })).save().then((vote) => {
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
              text: '<!channel> Let\'s vote for a topic!',
              attachments: [{
                text,
                callback_id: vote._id,
                actions: mapped
              }]
            });
          });
        } else {
          res.status(200).json({
            response_type: 'in_channel',
            text: 'There are currently no topics available, add some more!'
          });
        }
      });
    }
  });
};

exports.vote = (req, res) => {
  const payload = JSON.parse(req.body.payload);
  Vote.findById(payload.callback_id).then((vote) => {
    vote.topics.forEach(el => {
      if (el._id.toString() === payload.actions[0].value) {
        let votedby = el.votedby;
        votedby.push(payload.user.name);
        el.votedby = votedby.filter((el, pos, arr) => arr.indexOf(el) == pos);
      }
    });
    Vote.findByIdAndUpdate(payload.callback_id, vote).then(()=>{
      let message = payload.original_message;
      let map = new Map();
      Promise.all(vote.topics.map((topic, index) => {
        return Topic.findById(topic._id).then((dbTopic) => {
          map.set(index, `${index + 1}. ${dbTopic.name} (${topic.votedby.length} vote(s))`);
          return {
            name: 'topic',
            type: 'button',
            value: topic._id,
            text: index + 1
          };
        });
      })).then((actions)=>{
        message.attachments[0].actions = actions;
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
      });
    });
  });
};

const resendVote = (req, res, existingVote) => {
  Topic.find({
    '_id': {
      $in: existingVote.topics
    }
  }).then((topics) => {
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

const tryGetExistingVote = () => {
  return Vote.find({ finished: false });
};