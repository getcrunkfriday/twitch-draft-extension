from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import jwt
import json
import config
import time
import math

app=Flask(__name__)
app.config.from_pyfile("config.py")
app.config['SQLALCHEMY_DATABASE_URI']= 'sqlite:///test.db'

db = SQLAlchemy(app)

user_votes={}

# DB models. Should probably move to new file.
class GameVotes(db.Model):
	id = db.Column('entry_id', db.Integer, primary_key = True)
	channel_id = db.Column(db.String(50))
	game_id = db.Column(db.Integer)
	votes = db.Column(db.JSON)

server_token_duration_sec = 30
bearer_prefix='Bearer '

def make_server_token(channel_id):
	"""
	JWT sign a Twitch extensions payload.
	:return: string
	"""
	try: 
		payload = {
			exp: math.floor(time.time() / 1000) + server_token_duration_sec,
			channel_id: channel_id,
			user_id: app.config.OWNER_ID,
			role: "external",
			pubsub_perms: {
				send: ['*']
			}
		}
		return jwt.encode(payload, app.config.SECRET, algorithm="HS256")
	except Exception as e:
		return e

def decode_token(header):
	"""
	Decode a Twitch extensions payload.
	"""
	if header.startswith(bearer_prefix):
		try:
			token=header[len(bearer_prefix):]
			return jwt.decode(token, app.config.SECRET, algorithms=['HS256'])
		except Exception e:
			return e


@app.route('/draft_extension/<channel_id>/<game_id>/<user_id>/<vote_id>', methods=['POST'])
def add_vote(channel_id,game_id,user_id,vote_id):
	"""
	Adds a vote for a user, if the user hasn't already voted.
	"""
	payload=decode_token(request.headers.authorization)
	if channel_id not in user_votes:
		user_votes[channel_id]=set([user_id])
	# If the user hasn't voted in this timeframe...
	if user_id not in user_votes['channel_id']:
		headers = {
			'Client-ID': app.config.CLIENT_ID,
			'Content-Type': 'application/json',
			'Authorization': bearer_prefix + make_server_token(channel_id)
		}
		body = json.dumps({
			content_type: 'application/json',
			message: vote_id,
			targets: ['broadcast']
			})
		# Send request with headers and body.




@app.route('/draft_extension/<channel_id>/<game_id>', methods=['GET'])
def get_votes(channel_id,game_id,user_id):
	# Check Python requests library to see how this is captured.
	payload=decode_token(request.headers.authorization)
	votes_json=GameVotes.query.filter_by(channel_id=channel_id,game_id=game_id).first()
	if votes_json:
		return votes_json
	else:
		return {}