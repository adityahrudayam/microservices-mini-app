const express = require('express');
const cors = require('cors');

const app = express();

const posts = {}; // query-service
// structure - posts: { postId: { _id, title, content, imagePath, comments: [{ id: commentId, content }] } }

app.use(express.json({ limit: '50kb' }));
app.use(cors());

app.get('/posts', (req, res) => {
    res.status(200).json({
        message: 'OK',
        posts: posts
    });
});

app.get('/posts/:id/comments', (req, res) => {
    const postId = req.params.id;
    if (!(postId in posts)) {
        return res.status(404).send('Not found');
    }
    res.status(200).json({
        message: 'OK',
        comments: posts[postId]['comments']
    });
});

app.post('/events', (req, res) => {
    const event = req.body;
    if (event.type === 'PostCreated') {
        const { postId, title, content, imagePath } = event.data;
        if (postId in posts) {
            return res.send('Invalid data!');
        }
        posts[postId] = {
            _id: postId,
            title,
            content,
            imagePath,
            comments: []
        };
    }
    if (event.type === 'CommentCreated') {
        const { commentId: id, postId, content } = event.data;
        if (!(postId in posts)) {
            return res.send('Invalid data!');
        }
        const comments = posts[postId];
        comments.push({ id, content });
        posts[postId] = comments;
    }
    console.log(posts);
    res.status(200).send({});
});

app.listen(3002, () => {
    console.log("Query service listening on port: 3002");
});