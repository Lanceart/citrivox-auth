const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');

const { AuthenticationDetails, CognitoUser, CognitoUserPool } = require('amazon-cognito-identity-js');


require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());



// Fetch JWKS once at startup
let jwks;
let pem;

const fetchJwks = async () => {
  const url = `https://cognito-idp.us-west-1.amazonaws.com/us-west-1_NNbhylbJi/.well-known/jwks.json`;
  const response = await axios.get(url);
  jwks = response.data;
  const jwk = jwks.keys[0];
  pem = jwkToPem(jwk);
};

fetchJwks().catch(console.error);



AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION, // Your region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your access key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Your secret key
  });


const cognito = new AWS.CognitoIdentityServiceProvider();


app.get('/',(req,res)=>{
    res.status(200).send('good status')
})



  
//Create user pool
app.post('/signup', async (req, res) => {
    // console.log('Signup request body:', req.body);
    const { username, password, email } = req.body;
    const params = {
      ClientId: process.env.AWS_COGNITO_CLIENTID,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        }
      ]
    };
  
    try {
      const data = await cognito.signUp(params).promise();
      res.status(200).json({ message: 'User signed up', data });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });


  // Request new confirmation code endpoint
app.post('/request-new-code', (req, res) => {
    const { username } = req.body;

    const params = {
        ClientId: process.env.AWS_COGNITO_CLIENTID,
        Username: username
    };

    cognito.resendConfirmationCode(params, (err, data) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(200).json({ message: 'New confirmation code requested successfully', data });
        }
    });
});



  app.post('/confirm-signup', (req, res) => {
    const { username, code } = req.body;

    const params = {
        ClientId: process.env.AWS_COGNITO_CLIENTID,
        Username: username,
        ConfirmationCode: code
    };

    cognito.confirmSignUp(params, (err, data) => {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(200).json({ message: 'User confirmed successfully', data });
        }
    });
});


app.post('/login', async (req, res) => {
    console.log('Login request body:', req.body); // Debugging statement
    const { username, password } = req.body;
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.AWS_COGNITO_CLIENTID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    };
  
    try {
      const data = await cognito.initiateAuth(params).promise();
      const { IdToken, AccessToken, RefreshToken } = data.AuthenticationResult;
      res.status(200).json({
        message: 'User logged in',
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
















//validate process
const poolData = {
    UserPoolId: process.env.AWS_POOL_ID,
    ClientId: process.env.AWS_COGNITO_CLIENTID
};
const userPool = new CognitoUserPool(poolData);

app.get('/validate-accesstoken', (req, res) =>{
    const token = req.headers.authorization.split(' ')[1];

    // console.log('mytoken', token)
    if (!token) {
        return res.status(400).json({ error: 'Access token not provided' });
    }

    const params = {
        AccessToken: token
    };

    try{
    cognito.getUser(params, (err, data) => {
        if (err) {
            // console.error('Error validating access token:', err);
            res.status(401).json({ error: 'Access token is invalid' });
        } else {
            res.status(200).json({ message: 'Access token is valid' });
        }
    }
    );
    }catch (err) {
        res.status(400).send(' Error validating access token ');
    }
})

app.listen(port, ()=>{
    console.log(`Server is running on http://localhost:${port}`)
})