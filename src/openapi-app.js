import {} from 'dotenv/config'; //tricky - Improve
import express from 'express';
import {mongooseConnect} from './config/db';
import {auth, requiresAuth, sslOpts} from './ssl_config';

const swaggerUi = require('swagger-ui-express');

const https = require('https');

const swaggerDocument = require('./api_schema');
const api = require('./api').api;

const app = express();
const port = process.env.PORT || 9000;
app.set('port', port);

app.use(express.json());

api.init();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.redirect('/api-docs')
});

// use as express middleware
app.use(requiresAuth(), (req, res) => api.handleRequest(req, req, res));

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth());

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
    res.send(req.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.openid.user));
});

// Tasks to run on start up
(async () => {
    try {
        await mongooseConnect();

        console.info('[init] Successfuly connected to mongodb');
    } catch (err) {
        console.info('[init] Mongodb connect error:\n', err);
        process.exit(2);
    }
})();


// start server
https.createServer(sslOpts, app)
    .listen(port, () => console.log(`Covital backend listening on port ${port}...`))
