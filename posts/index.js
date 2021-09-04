const { randomBytes } = require('crypto');
const path = require('path');

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');

const deleteFile = require('./delete-file');

const app = express();

const posts = {};
// data-structure would loook like: { postId: { _id, title: '', content: '', imagePath: '' } }

// file-filters
const IMG_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = IMG_TYPES[file.mimetype];
        let error = new Error("Invalid image type!");
        if (isValid) {
            error = null;
        }
        cb(error, "images");
    },
    filename: (req, file, cb) => {
        // console.log(file); - important difference btw angular formData & html data
        const name = file.originalname.split(' ').join('-');
        const ext = IMG_TYPES[file.mimetype];
        cb(null, Date.now() + '-' + name + '.' + ext);
    }
});
const fileFilter = (req, file, cb) => {
    if (IMG_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Not a valid image type'), false);
    }
};

app.use(express.json({ limit: '50kb' }));
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.post('/create-post', multer({ storage: storage, fileFilter: fileFilter, limits: { fields: 3, files: 1, fileSize: 15000000, fieldSize: 100000 } }).single("image"), (req, res) => {
    const url = req.protocol + '://' + req.get("host");
    const { title, content } = req.body;
    let postId = randomBytes(5).toString('hex');
    while (postId in posts) {
        postId = randomBytes(5).toString('hex');
    }
    const imagePath = url + '/' + req.file.path;
    posts[postId] = {
        _id: postId,
        title,
        content,
        imagePath
    };
    // emit the event for the event-bus to catch
    const event = {
        type: "PostCreated",
        data: {
            postId,
            title,
            content,
            imagePath
        }
    };
    axios.post('http://localhost:3003/events', event).catch(err => {
        console.log(err.message);
    });
    // response
    res.status(201).json({
        message: 'OK',
        post: posts[postId]
    });
});

app.put('/edit-post', multer({ storage: storage, fileFilter: fileFilter, limits: { files: 1, fileSize: 15000000 } }).single("image"), (req, res) => {
    if (!(req.body.id in posts)) {
        console.log("Invalid Data");
        return res.status(404).send("Invalid data!");
    }
    let imagePath = req.body.imagePath;
    if (req.file) {
        // console.log("post-details: ", posts[req.body.id]);
        deleteFile(posts[req.body.id].imagePath); // passing the whole url here, so this needs to be broken down
        const url = req.protocol + '://' + req.get("host");
        imagePath = url + "/images/" + req.file.filename;
    }
    const updatedPost = {
        _id: req.body.id,
        title: req.body.title,
        content: req.body.content,
        imagePath
    }
    posts[req.body.id] = updatedPost;
    res.status(200).json({
        message: 'OK',
        posts: posts
    });
});

app.delete('/delete-post/:id', (req, res) => {
    if (!(req.params.id in posts)) {
        return res.status(404).json({
            message: 'Error'
        });
    }
    delete posts[req.params.id];
    return res.status(200).json({
        message: 'OK'
    });
});

app.get('/posts', (req, res) => {
    res.status(200).json({
        message: 'OK',
        posts: Object.values(posts)
    });
});

app.get('/posts/:id', (req, res) => {
    const postId = req.params.id;
    if (!(postId in posts)) {
        return res.status(404).send({});
    }
    res.status(200).json({
        message: 'OK',
        post: posts[postId]
    });
});

app.post('/events', (req, res) => {
    console.log('Event received: ' + req.body.type);
    res.status(200).send({});
});

app.listen(3000, () => {
    console.log("Server is running on port: 3000");
});