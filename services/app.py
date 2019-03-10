from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import jwt as jwt
import json
import config
import time
import math
import requests

app=Flask(__name__)
app.config.from_pyfile("config.py")
app.config['SQLALCHEMY_DATABASE_URI']= 'sqlite:///test.db'

db = SQLAlchemy(app)

user_votes={}

# DB models. Should probably move to new file.
#class GameVotes(db.Model):
#	id = db.Column('entry_id', db.Integer, primary_key = True)
#	channel_id = db.Column(db.String(50))
#	game_id = db.Column(db.Integer)
#	votes = db.Column(db.JSON)

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
	except Exception, e:
		return e

def decode_token(header):
	"""
	Decode a Twitch extensions payload.
	"""
	if header.startswith(bearer_prefix):
		try:
			token=header[len(bearer_prefix):]
			return jwt.decode(token, app.config.SECRET, algorithms=['HS256'])
		except Exception, e:
			return e


@app.route('/draft_extension/add_vote/<game_id>/<vote_id>', methods=['POST'])
def add_vote(game_id,vote_id):
	"""
	Adds a vote for a user, if the user hasn't already voted.
	"""
	payload=decode_token(request.headers.authorization)
	channel_id=payload['channelId']
	user_id   =payload['userId']
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
		apiHost='localhost.rig.twitch.tv:3000'
		response = requests.post(
			"https://"+apiHost+"/extensions/message/"+channel_id,
			data=body,
			headers=headers
			)
		print "Response recieved:",response



@app.route('/draft_extension/get_votes/<game_id>', methods=['GET'])
def get_votes(game_id):
	# Check Python requests library to see how this is captured.
	payload=decode_token(request.headers.authorization)
	channel_id=payload['channelId']
	#votes_json=GameVotes.query.filter_by(channel_id=channel_id,game_id=game_id).first()
	if channel_id in user_votes:
		votes_json=json.dumps(user_votes[channel_id])
		print "Getting votes:",votes_json
		if votes_json:
			return votes_json
	else:
		return {}
