const { randomBytes } = require('crypto');

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

const comments = {}; // by postId
// structure: { postId: [ { id, content } ] }

// middlewares
app.use(express.json({ limit: '50kb' }));
app.use(cors());

app.post('/posts/:id/comment', (req, res) => {
    const { content } = req.body;
    const postId = req.params.id;
    if (!(postId in comments)) {
        return res.status(422).send("Invalid data!");
    }
    const postComments = comments[postId];
    const commentIds = postComments.map(comment => comment['id']);
    let id = randomBytes(6).toString('hex');
    while (id in commentIds) {
        id = randomBytes(6).toString('hex');
    }
    postComments.push({ id, content });
    comments[postId] = postComments;
    // emit the event
    const event = {
        type: "CommentCreated",
        data: {
            commentId: id,
            postId,
            content
        }
    };
    axios.post('http://localhost:3003/events', event).catch(err => {
        console.log(err.message);
    });

    res.status(201).json({
        message: 'OK',
        comments: postComments
    });
});

app.get('/posts/:id/comments', (req, res) => {
    res.status(200).send(comments[req.params.id] || []);
});

app.post('/events', (req, res) => {
    const event = req.body;
    if (event.type === 'PostCreated') {
        const { postId } = event.data;
        comments[postId] = [];
    }
    res.status(200).send({});
});

app.listen(3001, () => {
    console.log("Server running on port: 3001");
});