//Require libraries to enable this application
const express = require('express');
const dayjs = require('dayjs');
const { getConversation, addTopic, getConversationItem, updateConversation, replyToMessage, getTopics, listAgents } = require('../util/api');
require('dotenv').config();

module.exports = () => {
  const router = express.Router();

  router.post('/', (req, res) => {
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got POST from Gladly ${JSON.stringify(req.body)}`);

    //This webhook only respects MESSAGE/RECEIVED and PING
    if(req.body.type == 'PING') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got a PING event - sending back success message`);

      return res.sendStatus(200);
    }
    else if(req.body.type != 'MESSAGE/RECEIVED') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Not processing webhook as this was not a MESSAGE/RECEIVED event`);

      return res.sendStatus(500);
    }

    let thisConversationId = req.body.content.conversationId;
    let thisConversationItemId = req.body.content.conversationItemId;

    getConversation(thisConversationId)
    .then((conversation) => {
      conversation = conversation.data;

      //If conversation is currently CLOSED, no need to process this request
      if(conversation.status == 'CLOSED') {
          console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Not processing ${thisConversationId} as this conversation is currently closed`);

        return res.sendStatus(200);
      }

      //If CHATBOT_EXCLUDE_TOPIC_NAME is applied, do not process this message, and move on
      let hasSkipTopic = (conversation.topicIds && conversation.topicIds.length) ? (conversation.topicIds).filter(t => { return t == process.env.CHATBOT_EXCLUDE_TOPIC_ID }) : false;
      if(hasSkipTopic && hasSkipTopic.length) {
          console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Not processing ${thisConversationId} as topic ID ${process.env.CHATBOT_EXCLUDE_TOPIC_ID} is added to this conversation`);

        return res.sendStatus(200);
      }

      getConversationItem(thisConversationItemId)
      .then((conversationItem) => {
        conversationItem = conversationItem.data;

        //If it's not a chat message, OR if it contains the word "agent" in the message, move it to another inbox and add the exclude topic ID
        if(conversationItem.content.type != 'CHAT_MESSAGE' || conversationItem.content.content.toLowerCase().indexOf('agent') != -1) {
          Promise.all([
            addTopic(thisConversationId, { topicIds: [process.env.CHATBOT_EXCLUDE_TOPIC_ID] }),
            updateConversation(thisConversationId, {
              assignee: {
                agentId: '',
                inboxId: process.env.CHATBOT_MOVE_TO_INBOX_ID
              }, status: {
                value: 'OPEN',
                force: true
              }
            })
          ]).then(() => {
            console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Reassigned ${thisConversationId} to inbox ID ${process.env.CHATBOT_MOVE_TO_INBOX_ID} and added topic ID ${process.env.CHATBOT_EXCLUDE_TOPIC_ID}`);

            res.sendStatus(200);
          }).catch((e) => {
            console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not move ${thisConversationId} to ${process.env.CHATBOT_MOVE_TO_INBOX_ID} or add topic ID ${process.env.CHATBOT_EXCLUDE_TOPIC_ID} due to ${JSON.stringify(e)}`);
          });
        } else if (conversationItem.content.content.toLowerCase().indexOf('we are done now') != -1) {
          addTopic(thisConversationId, { topicIds: [process.env.CHATBOT_DEFAULT_TOPIC_ID] })
          .then(() => {
            return updateConversation(thisConversationId, {
              status: {
                value: 'CLOSED',
                force: true
              },
              assignee: {
                agentId: process.env.CHATBOT_AGENT_ID,
                inboxId: conversation.inboxId
              }
            })
          }).then(() => {
            console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Closed conversation ${thisConversationId} and added topic ID ${process.env.CHATBOT_DEFAULT_TOPIC_ID}`);

            res.sendStatus(200);
          }).catch((e) => {
            console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not close conversation due to ${JSON.stringify(e)}`);

            res.sendStatus(500);
          });
        } else {
          Promise.all([
            updateConversation(thisConversationId, {
              assignee: {
                agentId: process.env.CHATBOT_AGENT_ID,
                inboxId: conversation.inboxId
              }, status: {
                value: 'OPEN',
                force: true
              }
            }),
            replyToMessage(thisConversationItemId, {
              content: {
                type: 'CHAT_MESSAGE',
                messageType: 'TEXT',
                body: `thank you for contacting us. reply "agent" to be directed to an agent. reply "we are done now" to close this chat session.`
              }
            })
          ]).then(() => {
            console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Sent reply to ${thisConversationId} and reassigned conversation to ${process.env.CHATBOT_AGENT_ID}`);

            res.sendStatus(200);
          }).catch((e) => {
            console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not reply to ${thisConversationId} due to ${JSON.stringify(e)}`);

            res.sendStatus(500);
          });
        }
      }).catch((e) => {
        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not retrieve details on conversation item ID: ${thisConversationItemId} due to ${JSON.stringify(e)}`);

        res.sendStatus(500);
      })
    })
    .catch((e) => {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not retrieve details on conversation ID ${thisConversationId} due to ${JSON.stringify(e)}`);

      res.sendStatus(500);
    });
  });

  return router;
};
