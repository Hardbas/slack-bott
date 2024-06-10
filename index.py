import logging
from slack_bolt import App
from slack_bolt.adapter.flask import SlackRequestHandler
from flask import Flask, request
import os
import re

# Initialize logging
logging.basicConfig(level=logging.DEBUG)

# Initialize the Slack app with your bot token
bolt_app = App(token=os.environ.get("SLACK_BOT_TOKEN"))

# Initialize Flask
flask_app = Flask(__name__)

# Create a SlackRequestHandler
handler = SlackRequestHandler(bolt_app)

# Define a simple health check route
@flask_app.route("/health", methods=["GET"])
def health_check():
    return "OK", 200

# Create a route to handle Slack events
@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)

# Expose the Flask app for Vercel
app = flask_app

if __name__ == "__main__":
    flask_app.run(debug=True)
