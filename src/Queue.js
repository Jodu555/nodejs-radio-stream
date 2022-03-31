const generateRandomId = () => Math.random().toString(36).slice(2);

const { PassThrough } = require('stream');
const Throttle = require('throttle');
const { ffprobeSync } = require('ffprobe');

const fs = require('fs');


class Queue {
    constructor(params) {
        this._sinks = new Map(); // map of active sinks/writables
        this._songs = []; // list of queued up songs
        this._currentSong = null;
        // this.stream = new EventEmitter();
    }

    init() {
        this._currentSong = 'mukke.mp3';
    }

    makeResponseSink() {
        const id = generateRandomId();
        const responseSink = PassThrough();
        this._sinks.set(id, responseSink);
        return { id, responseSink };
    }

    removeResponseSink(id) {
        this._sinks.delete(id);
    }

    _broadcastToEverySink(chunk) {
        for (const [, sink] of this._sinks) {
            sink.write(chunk);
        }
    }

    _getBitRate(song) {
        try {
            const bitRate = ffprobeSync(Path.join(process.cwd(), song)).format.bit_rate;
            return parseInt(bitRate);
        }
        catch (err) {
            return 128000; // reasonable default
        }
    }

    _playLoop() {

        // this._currentSong = this._songs.length
        //     ? this.removeFromQueue({ fromTop: true })
        //     : this._currentSong;
        const bitRate = this._getBitRate(this._currentSong);

        const songReadable = fs.createReadStream(this._currentSong);

        const throttleTransformable = new Throttle(bitRate / 8);
        throttleTransformable.on('data', (chunk) => this._broadcastToEverySink(chunk));
        throttleTransformable.on('end', () => this._playLoop());

        // this.stream.emit('play', this._currentSong);
        songReadable.pipe(throttleTransformable);
    }

    startStreaming() {
        this._playLoop();
    }
}

module.exports = Queue;