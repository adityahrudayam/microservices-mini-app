const fs = require('fs');
const path = require('path');

module.exports = (fileUrl) => {
    if (!fileUrl) return;
    const urlPieces = fileUrl.split('/');
    const filePath = path.join(__dirname, 'images', urlPieces[urlPieces.length - 1]);
    fs.unlink(filePath, err => {
        if (err) {
            throw new Error("An error occurred!");
        }
    })
};