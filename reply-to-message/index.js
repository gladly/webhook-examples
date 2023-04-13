//Requires local environment variables via a .env file
require('dotenv').config();

//Requird libraries for a node.js application using the express framework
const express = require('express');
const bodyParser = require('body-parser');
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: () => true }));

const lookupRoutes = require('./routes');
app.use('/', lookupRoutes());

//Start app and make it available on localhost:8000
const port = 8000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
