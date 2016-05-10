# habitbot
**Integrating your Habitica party with Slack chat**

To run:

1. Clone repo
2. `npm install; grunt`
3. Create a `apiToken` file containing your slackbot's token
4. Create a `habit.json` file containing your user ID, api key and groupId for your party
5. `npm start`

to deploy to heroku:

1. `heroku create`
2. `heroku config:set SLACK_HABITICA_BOT_TOKEN=[Your API token]`
3. `git push heroku master`
