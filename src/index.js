const http = require('http');
const express = require('express');
const https = require('https');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Queue = require('./Queue');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

let server;
if (process.env.https) {
    const sslProperties = {
        key: fs.readFileSync(process.env.KEY_FILE),
        cert: fs.readFileSync(process.env.CERT_FILE),
    };
    server = https.createServer(sslProperties, app)
} else {
    server = http.createServer(app);
}


// Your Middleware handlers here

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const audioFile = 'mukke.mp3';

app.get('/radio', function (req, res) {
    var stat = fs.statSync(audioFile);
    var total = stat.size;
    if (req.headers.range) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total - 1;
        var chunksize = (end - start) + 1;
        var readStream = fs.createReadStream(audioFile, { start: start, end: end });
        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
            // 'Accept-Ranges': 'bytes', 'Content-Length': chunksize,
            'Content-Type': 'audio/mpeg'
        });
        readStream.pipe(res);
    } else {
        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'audio/mpeg' });
        fs.createReadStream(audioFile).pipe(res);
    }
});

// const queue = new Queue();
// queue.init();
// queue.startStreaming();

// app.get('/radio', (req, res) => {
//     const { id, responseSink } = queue.makeResponseSink();
//     req.sinkId = id;
//     const headers = {
//         "Content-Type": "audio/mp3",
//     };
//     res.writeHead(206, headers);
//     responseSink.pipe(res);
// });

// app.get('/radio', (req, res) => {
//     const range = req.headers.range;
//     if (!range) {
//         return res.status(400).send("Requires Range header");
//     }
//     const videoSize = fs.statSync(audioFile).size;
//     const CHUNK_SIZE = 10 ** 6;
//     const start = Number(range.replace(/\D/g, ""));
//     const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
//     const contentLength = end - start + 1;
//     const headers = {
//         "Content-Range": `bytes ${start}-${end}/${videoSize}`,
//         "Accept-Ranges": "bytes",
//         "Content-Length": contentLength,
//         "Content-Type": "audio/mp3",
//     };
//     console.log(headers);
//     res.writeHead(206, headers);
//     const audioStream = fs.createReadStream(audioFile, { start, end });
//     audioStream.pipe(res);
// });


const PORT = process.env.PORT || 3100;
server.listen(PORT, () => {
    console.log(`Express App Listening ${process.env.https ? 'with SSL ' : ''}on `);
});