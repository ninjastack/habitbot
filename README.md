# habitbot
**Integrating your Habitica party with Slack chat**

To run:

1. Clone repo
1. `npm install; grunt`
1. Create a `apiToken` file containing your slackbot's token
1. Create a `habit.json` file containing your user ID, api key and groupId for your party
1. `npm start`

to deploy to heroku:

1. `heroku create`
1. `heroku config:set SLACK_HABITICA_BOT_TOKEN=[Your Slackbot API token]`
1. `heroku config:set SLACK_HABITICA_BOT_UID=[Your Habitica UserId]`
1. `heroku config:set SLACK_HABITICA_BOT_KEY=[Your Habitica Secret Key]`
1. `heroku config:set SLACK_HABITICA_BOT_GID=[Your Habitica GroupId]`
1. `git push heroku master`
