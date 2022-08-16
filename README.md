# Background

This repository contains code examples, written in node.js, depicting common use cases for how to utilize Gladly REST API and Webhooks.

This repository should be used as a tool for **learning** and not as production code!

# Setup

## Step 1: Generate Gladly API token

Please follow [these](https://developer.gladly.com/rest/#section/Getting-Started/Creating-API-Tokens) instructions to create an API token.

## Step 2: Setup Gladly

To run the apps in this tutorial, you'll need to set up a few other things in Gladly:

### Backend Chatbot
1. [Create a Gladly Sidekick](https://help.gladly.com/docs/create-and-configure-sidekick), setting the hours to 24/7 and enabling messaging automation. Click on [View Preview](https://help.gladly.com/docs/create-and-configure-sidekick#preview-and-embed-sidekick) to get a link to preview and interact with your Sidekick.
2. In the Channel Settings page, [route chat messages to an inbox where your Agents are staffed in](https://help.gladly.com/docs/set-up-channels-and-entry-points#route-requests-to-a-particular-inbox-based-on-the-entry-point)

### CSAT Survey
8. Create a [messaging webhook URL](https://api.slack.com/messaging/webhooks) for a Slack channel of your choice and save this to a safe space

## Step 3: Setup .env file

Now, you can set up your environment variables. To do so, copy the `.env-sample` file found in the root folder of this repository into a new file called `.env` (also to be created at the root folder of this repository).

Set the following:
- `GLADLY_HOST`: Set this to your Gladly URL (e.g.: https://sandbox.gladly.qa), making sure to not have an ending `/` at the end and including the `https://` protocol at the beginning
- `GLADLY_USERNAME`: Your Gladly developer email address (e.g.: gladlyadmin@gladly.com)
- `GLADLY_API_TOKEN`: The API token that you generated in Step 1
- `CSAT_SLACK_WEBHOOK`: The Slack webhook URL you copied in Step 2.8

Save the file

## Step 4: Install node modules

Make sure you are in the root directory of this repository on Terminal, then run this command:

`yarn install`

## Step 5: Setup ngrok

This repository uses ngrok to make the Lookup Adapter endpoint publicly accessible
- Create an account on [ngrok](https://dashboard.ngrok.com/signup) if you don't already have one
- Go [here](https://dashboard.ngrok.com/get-started/setup) and follow the instructions in Step 1 & 2 to install `ngrok`
- Download the ngrok binary to your local machine - you will likely need grant permission to use it in your `System Preferences > Security and Privacy` settings

# Sample Applications

## Backend Chatbot

### What this does

In a nutshell, this application allows you to embed Gladly Sidekick on your front-end website or mobile app, but respond to messages using a back-end bot. When the bot determines it needs to pass off the interaction to a real human, the bot hands the conversation off to the Sidekick inbox configured in the Entry Points page on Gladly.

### Running this app

1. Open up Terminal. In the root directory of this repository, type in `node backend-chatbot`
2. In a new tab on Terminal, type in `ngrok http 8000` and copy the HTTPS link
3. Go to `More Settings > Webhooks` in Gladly and create a webhook for `AUTOMATION/MESSAGE_RECEIVED` using the HTTPS link you just copied. Leave all other fields blank - you can name this webhook whatever you'd like.

### Testing

1. In a new tab, go to the Sidekick preview link you generated in Step 2.3 and start a chat session:
![](./tutorial-images/chat-session.png)
2. You will then receive an automated response with the following text: `Random message: MESSAGE. Type agent if you want to be handed off to an agent.`. This is a message sent by the backend chatbot! Since this is handled by a bot, it won't appear in Gladly for you or an Agent to view yet.
3. Type in `agent`
4. Log in to Gladly as an administrator and then view the inbox you configured to receive Sidekick contacts. You'll see that the bot has created a new chat session that an Agent can reply to - and has "handed off" the interaction to you!
5. NOTE: If you do not respond for > 5 minutes, the bot will automatically close the chat session and will not route it to an agent.

### How it accomplishes this

1. The app listens to the `AUTOMATION/MESSAGE_RECEIVED` or `PING` webhook `POST` requests made by Gladly
2. If it receives any other type of webhook, it stops processing the request and sends back a `500` HTTP status code
3. If it is a `PING` webhook, it will respond back with HTTP 200. This is Gladly's way of checking if the webhook is alive. Gladly will not allow you to save the webhook in the Gladly UI **if your app does not send back a HTTP 200 OK status code** on the `PING` event
4. Otherwise, upon `AUTOMATION/MESSAGE_RECEIVED`, the app will get the body of the message using `content.message.content.body`
5. If the body does not contain the word `agent` in it, it will send a random message to the chatter using the `POST` `Send Outbound Automation Message` API.
6. Otherwise, the app will retrieve all previous messages sent back and forth in this interaction using the `GET` `Get Automation Messages` API and then use the response to compile a transcript of the bot and human interaction.
7. The app will then call `POST` `Agent Handoff` and populate `description` with the description compiled in step #6. At this point, the chat will be available for routing in an inbox to an Agent.
7. Otherwise, the app will retrieve the conversation item details using the webhook's `content.conversationItemId` field and the [Get Conversation Item](https://developer.gladly.com/rest/#operation/getItem) API.

## CSAT Survey

### What this does

In a nutshell, this application will send a message to a channel on Slack when a conversation is closed suggesting to send out a CSAT survey. In the real world, you'll likely want to replace the call to Slack with a real CSAT survey provider.  

It is **very important** to handle customer information with utmost care. Please check with the appropriate representatives and personnel at your company to ensure you are abiding by security standards. This tutorial logs information to Slack as a learning mechanism **only** and should **never be used in a production environment**.

### Running this app

1. Open up Terminal. In the root directory of this repository, type in `node csat-survey`
2. In a new tab on Terminal, type in `ngrok http 9000` and copy the HTTPS link
3. Go to `More Settings > Webhooks` in Gladly and create a webhook for `CONVERSATION/CLOSED` using the HTTPS link you just copied. Leave all other fields blank - you can name this webhook whatever you'd like.
![](./tutorial-images/csat-survey-webhook.png)

### Testing

1. Login to Gladly as an Administrator
2. Create a [new customer profile](https://help.gladly.com/docs/add-a-new-customer-profile), adding the email address (e.g.: your own email address) into the profile and a phone number (if you'd like)
![](./tutorial-images/customer-profile.png)
3. Click on the `+` button at the bottom of the profile to create a new conversation, and then click on `Email` to initiate an outbound email
4. Respond to the email. In a few minutes, your response should appear in the customer profile you created, like this:
![](./tutorial-images/inbound-email.png)
5. Add a topic to the conversation in Gladly:
![](./tutorial/add-topic.png)
6. Close the conversation by clicking on the down arrow and then clicking on `Close`
![](./tutorial-images/close-conversation.png)
7. You'll now see a message on the Slack channel you associated with this app in Step 2.8 that looks like the following:
![](./tutorial/slack-notification.png)

### How it accomplishes this

1. The app listens to the `CONVERSATION/CLOSED` or `PING` webhook `POST` requests made by Gladly
2. If it receives any other type of webhook, it stops processing the request and sends back a `500` HTTP status code
3. If it is a `PING` webhook, it will respond back with HTTP 200. This is Gladly's way of checking if the webhook is alive. Gladly will not allow you to save the webhook in the Gladly UI **if your app does not send back a HTTP 200 OK status code** on the `PING` event
4. Otherwise, upon `CONVERSATION/CLOSED`, the app will get the conversation details using the webhook's `content.conversationId` field and the [Get Conversation](https://developer.gladly.com/rest/#operation/getConversation), [Get Conversation Items](https://developer.gladly.com/rest/#operation/getConversationItems) APIs.
5. The app will also retrieve the customer profile in Gladly using the webhook's `content.customerId` field and the [GET Customer](https://developer.gladly.com/rest/#operation/getCustomer) API
6. Finally, the app will retrieve a list of agents on Gladly using the [List Agents](https://developer.gladly.com/rest/#operation/getAgents) API
7. The app will then post a Slack message using the Slack webhook configured in step 2.8 using the following information format:
```
Conversation ${thisConversationId} was closed on ${conversation.closedAt}. Please send a CSAT survey request. Details below:\n\nAgent Email: ${(currentAgent && currentAgent.length) ? currentAgent[0].emailAddress : 'N/A'}\nCurrent Inbox ID: ${currentInboxId}\nTopic IDs: ${topicIds}\nCustomer Emails: ${customerEmails}\nCustomer Phones: ${customerPhones}
```
  - `thisConversationId` is set to the conversation ID in the webhook payload (`content.conversationId`)
  - `conversation.closedAt` is set to the conversation's `closedAt` value that was retrieved in Step 4 of this section
  - `currentAgent` is set to the agent's email address. The agent's email address is retrieved from the list of agents you grabbed in Step 6 of this section: the `id` of the agent in this list is matched to the `agentId` in the conversation information you retrieved in Step 4 of this section.
  - `currentInboxId` is set to the conversation's `inboxId` value that was retrieved in Step 4 of this section
  - `customerEmails` is set to the list of customer email addresses retrieved in the `emails` array via the customer information retrieved in Step 6 of this section
  - `customerPhones` is set to the list of customer email addresses retrieved in the `emails` array via the customer information retrieved in Step 6 of this section
