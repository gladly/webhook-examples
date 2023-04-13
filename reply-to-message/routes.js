//Require libraries to enable this application
const express = require('express');
const dayjs = require('dayjs');
const { sendOutboundAutomationMessage, getAutomationSessionMessages, handoffToAgent, updateConversation, getConversationItem, replyToMessage } = require('../util/api');
require('dotenv').config();
const slugid = require('slugid');

module.exports = () => {
  const router = express.Router();

  router.post('/contact-message-received', (req, res) => {
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got POST from Gladly ${JSON.stringify(req.body)}`);

    //This webhook only respects MESSAGE/RECEIVED and PING
    if(req.body.type == 'PING') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got a PING event - sending back success message`);

      return res.sendStatus(200);
    }
    else if(req.body.type != 'CONTACT/MESSAGE_RECEIVED') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Not processing webhook as this was not a CONTACT/MESSAGE_RECEIVED event`);

      return res.sendStatus(500);
    }

    if(req.body.content.context.assignee.agentId && req.body.content.context.assignee.agentId != process.env.GLADLY_APP_BOT_AGENT_ID) {
      return res.sendStatus(200);
    }

    let pr = [];
    if(!req.body.content.context.assignee.agentId) {
      pr.push(updateConversation(req.body.content.conversationId, {
        assignee: {
          inboxId: req.body.content.context.assignee.inboxId,
          agentId: process.env.GLADLY_APP_BOT_AGENT_ID
        },
        status: {
          value: 'OPEN'
        }
      }));
    }

    let handedOff = false;

    Promise.all(pr)
    .then(() => {
      return getConversationItem(req.body.content.messageId)
    }).then((message) => {
      let thisMessage = message.data;

      if(thisMessage.content.content.toLowerCase().indexOf('agent') !== -1) {
        handedOff = true;
        return replyToMessage(thisMessage.id, {
          "content": {
            "type": thisMessage.content.type,
            "body": `Handing you off!`
          }
        })
      } else {
        return replyToMessage(thisMessage.id, {
          "content": {
            "type": thisMessage.content.type,
            "body": `Thank you for your message!`
          }
        })
      }
    }).then(() => {
      if(handedOff) {
        return updateConversation(req.body.content.conversationId, {
          assignee: {
            inboxId: req.body.content.context.assignee.inboxId,
            agentId: null
          },
          status: {
            value: 'OPEN'
          }
        })
      } else {
        return true;
      }
    }).then(() => {
      return res.sendStatus(200);
    }).catch((e) => {
      return res.sendStatus(406);
    });
  });

  return router;
};
