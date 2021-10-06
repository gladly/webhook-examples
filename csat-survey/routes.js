//Require libraries to enable this application
const express = require('express');
const dayjs = require('dayjs');
const { getConversation, getItems, listAgents, getCustomerById } = require('../util/api');
require('dotenv').config();
const Slack = require('slack-node');

module.exports = () => {
  const router = express.Router();

  router.post('/', (req, res) => {
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got POST from Gladly ${JSON.stringify(req.body)}`);

    //This webhook only respects CONVERSATION/CLOSED and PING
    if(req.body.type == 'PING') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got a PING event - sending back success message`);

      return res.sendStatus(200);
    }
    else if(req.body.type != 'CONVERSATION/CLOSED') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Not processing webhook as this was not a CONVERSATION/CLOSED event`);

      return res.sendStatus(500);
    }

    let thisConversationId = req.body.content.conversationId;
    let thisCustomerId = req.body.content.customerId;

    Promise.all([
      getConversation(thisConversationId),
      getItems(thisConversationId),
      listAgents(),
      getCustomerById(thisCustomerId)
    ])
    .then((conversationData) => {
      let conversation = conversationData[0].data;
      let conversationItems = conversationData[1].data;
      let agents = conversationData[2].data;
      let customer = conversationData[3].data;

      //Get topic IDs currently assigned to this conversation
      let topicIds = (conversation.topicIds && conversation.topicIds.length) ? (conversation.topicIds).join(',') : 'N/A';

      //Get the inbox ID currently assigned to this conversation
      let currentInboxId = conversation.inboxId;

      //Get email address of agent currently assigned to this conversation
      let currentAgent = agents.filter((a) => { return a.id == conversation.agentId });

      let customerEmails = [];
      for(let i in customer.emails) {
        customerEmails.push(customer.emails[i].original);
      }

      let customerPhones = [];
      for(let i in customer.phones) {
        customerPhones.push(customer.phones[i].original);
      }

      const slack = new Slack();
      slack.setWebhook(process.env.CSAT_SLACK_WEBHOOK);
      slack.webhook({
        text: `Conversation ${thisConversationId} was closed on ${conversation.closedAt}. Please send a CSAT survey request. Details below:\n\nAgent Email: ${(currentAgent && currentAgent.length) ? currentAgent[0].emailAddress : 'N/A'}\nCurrent Inbox ID: ${currentInboxId}\nTopic IDs: ${topicIds}\nCustomer Emails: ${customerEmails}\nCustomer Phones: ${customerPhones}`
      }, () => {});

      res.sendStatus(200);
    })
    .catch((e) => {
      console.log(e);

      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not retrieve details on conversation ID ${thisConversationId} due to ${JSON.stringify(e)}`);

      res.sendStatus(500);
    });
  });

  return router;
};
