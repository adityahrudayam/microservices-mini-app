const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(express.json({ limit: '50kb' }));
app.use(cors());

app.post('/events', (req, res) => {
    const event = req.body;
    // sending the event to the listeners
    axios.post('http://localhost:3000/events', event).catch(err => {
        console.log(err.message);
    });
    axios.post('http://localhost:3001/events', event).catch(err => {
        console.log(err.message);
    });
    axios.post('http://localhost:3002/events', event).catch(err => {
        console.log(err.message);
    });

    res.status(200).send({
        status: 'OK'
    });
});

app.listen(3003, () => {
    console.log("Event bus listening on port: 3003");
});