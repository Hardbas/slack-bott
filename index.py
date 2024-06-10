from slack_bolt import App
from slack_bolt.adapter.flask import SlackRequestHandler
import os
import re
from flask import Flask, request

# Initialize the Slack app with your bot token and signing secret
app = App(token=os.environ.get("SLACK_BOT_TOKEN"))

# Define the channel ID of your private channel
CHANNEL_ID = os.environ.get("SLACK_CHANNEL_ID")

# Your updated user token with required scopes
USER_TOKEN = os.environ.get("SLACK_USER_TOKEN")

# Initialize Flask
flask_app = Flask(__name__)

# Create a SlackRequestHandler
handler = SlackRequestHandler(app)

# Listen for DMs containing order numbers or ICCIDs
@app.message(re.compile(r"(#\w{8})|(898\d{16,})"))
def handle_message(client, event, say):
    query = event['text'].strip()
    print(f"Received DM with query: {query}")  # Debug statement
    
    # Use the user token to search messages in the private channel
    try:
        response = client.api_call("conversations.history", params={'channel': CHANNEL_ID}, headers={'Authorization': f'Bearer {USER_TOKEN}'})
        print(f"Response from conversations.history: {response}")  # Debug statement
        
        # Check if the response is ok and contains messages
        if response['ok'] and 'messages' in response:
            for message in response['messages']:
                if query in message['text']:
                    say(message['text'])
                    print(f"Matching message found: {message['text']}")  # Debug statement
                    return
        
        # If no matching message is found
        say("No matching order number or ICCID found.")
        print("No matching order number or ICCID found.")  # Debug statement
    except Exception as e:
        print(f"Error fetching conversation history: {e}")

# Create a route to handle Slack events
@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)

# Start the Flask app
if __name__ == "__main__":
    flask_app.run(debug=True)
