const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');
const sanitize = require('sanitize-filename');
const { getFinalPath, moveFile, tempDir } = require('./storage');
const chalk = require('chalk');

async function getInfo(url) {
    if (!ytdl.validateURL(url)) throw new Error('URL YouTube tidak valid.');
    const info = await ytdl.getInfo(url);
    return info;
}

async function downloadMedia(url, info, format, type) {
    return new Promise((resolve, reject) => {
        const title = sanitize(info.videoDetails.title);
        const ext = type === 'audio' ? 'mp3' : 'mp4';
        const filename = `${title}.${ext}`;
        const tempPath = path.join(tempDir, filename);
        const finalPath = getFinalPath(filename);
        
        const video = ytdl(url, { format });
        const bar = new cliProgress.SingleBar({
            format: chalk.cyan('Progress') + ' |' + chalk.magenta('{bar}') + '| {percentage}% || {value}/{total} Bytes',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        
        let started = false;
        
        video.on('response', (res) => {
            const totalSize = res.headers['content-length'];
            bar.start(totalSize, 0);
            started = true;
        });
        
        video.on('progress', (chunkLength, downloaded, total) => {
            if (started) bar.update(downloaded);
        });
        
        video.on('error', (err) => {
            if (started) bar.stop();
            reject(err);
        });
        
        video.on('end', () => {
            bar.stop();
            setTimeout(() => {
                try {
                    // Pindahkan file secara otomatis ke Internal Storage
                    moveFile(tempPath, finalPath);
                    resolve({ title, type, path: finalPath });
                } catch (e) {
                    reject(new Error(`Gagal memindahkan file ke ${finalPath}. Izin ditolak atau disk penuh.`));
                }
            }, 500); // delay sejenak agar stream file benar-benar tertutup
        });
        
        video.pipe(fs.createWriteStream(tempPath));
    });
}

module.exports = { getInfo, downloadMedia, ytdl };
