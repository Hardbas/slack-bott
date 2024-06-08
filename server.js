const express = require('express');
const bodyParser = require('body-parser');
const { App } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
require('dotenv').config();

// Initialize your Bolt app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

async function findDetails(query) {
  try {
    const response = await client.conversations.history({
      channel: process.env.SLACK_CHANNEL_ID,
    });

    for (const message of response.messages) {
      if (message.text.includes(query)) {
        return message.text;
      }
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
  return 'Details not found';
}

app.message(/(\b\d{19}\b|\bORDER\d{6}\b)/, async ({ message, say }) => {
  const query = message.text;
  const details = await findDetails(query);
  await say(`Details for ${query}: ${details}`);
});

const expressApp = express();
expressApp.use(bodyParser.json());

expressApp.post('/slack/events', async (req, res) => {
  const slackEvent = req.body;
  console.log('Received Slack Event:', JSON.stringify(slackEvent, null, 2));

  if (slackEvent.type === 'url_verification') {
    console.log('Responding to URL verification challenge:', slackEvent.challenge);
    res.status(200).send(slackEvent.challenge);
    return;
  }

  const slackRequest = {
    body: req.body,
    headers: req.headers,
  };
  const slackResponse = {
    status: (code) => res.status(code),
    send: (data) => res.send(data),
  };

  await app.processEvent(slackRequest, slackResponse);
});

const PORT = process.env.PORT || 3000;
expressApp.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
