const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');


const app = express();
const port = 3000;

app.use(bodyParser.json());

AWS.config.update({
    region: 'us-east-1', // Your region
    accessKeyId: 'YOUR_ACCESS_KEY', // Your access key
    secretAccessKey: 'YOUR_SECRET_KEY' // Your secret key
  });


app.get('/',(req,res)=>{
    res.status(200).send('good status')
})


app.listen(port, ()=>{
    console.log(`Server is running on http://localhost:${port}`)
})