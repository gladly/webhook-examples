//Require libraries to enable this application
const express = require('express');
const dayjs = require('dayjs');
const { sendOutboundAutomationMessage, getAutomationSessionMessages, handoffToAgent } = require('../util/api');
require('dotenv').config();
const slugid = require('slugid');

module.exports = () => {
  const router = express.Router();

  router.post('/', (req, res) => {
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got POST from Gladly ${JSON.stringify(req.body)}`);

    //This webhook only respects MESSAGE/RECEIVED and PING
    if(req.body.type == 'PING') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Got a PING event - sending back success message`);

      return res.sendStatus(200);
    }
    else if(req.body.type != 'AUTOMATION/MESSAGE_RECEIVED') {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Not processing webhook as this was not a AUTOMATION/MESSAGE_RECEIVED event`);

      return res.sendStatus(500);
    }

    let thisMessageBody = req.body.content.message.content.body;
    let thisSessionId = req.body.content.sessionId;

    if(thisMessageBody.toLowerCase().indexOf('agent') != -1) {
      //hand off to agent
      getAutomationSessionMessages(thisSessionId)
      .then((sessionMessages) => {
        handoffToAgent(thisSessionId, {
          description: `Bot handed off interaction after ${sessionMessages.data.length} messages`
        })
        .then(() => {
          return res.sendStatus(200);
        }).catch((e) => {
          console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not send close automation session due to ${JSON.stringify(e)}`);

          //don't try again
          return res.sendStatus(406);
        })
      }).catch((e) => {
        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not send retrieve session's automation messages due to ${JSON.stringify(e)}`);

        //don't try again
        return res.sendStatus(406);
      })
    } else {
      sendOutboundAutomationMessage(thisSessionId, {
        type: 'TEXT',
        content: {
          value: `Random message: ${slugid.nice()}. Type agent if you want to be handed off to an agent.`
        }
      }).then(() => {
        return res.sendStatus(200);
      }).catch((e) => {
        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Could not send outbound automation message due to ${JSON.stringify(e)}`);

        //don't try again
        return res.sendStatus(406);
      })
    }
  });

  return router;
};
