import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { App } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

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
        return message.text; // Customize this to extract specific details
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

// Add a route for the root URL
expressApp.get('/', (req, res) => {
  res.send('Hello, world! The server is up and running.');
});

expressApp.post('/slack/events', async (req, res) => {
  const slackEvent = req.body;
  console.log('Received Slack Event:', JSON.stringify(slackEvent, null, 2));

  // URL Verification Challenge
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
