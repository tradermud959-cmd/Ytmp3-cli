const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const { getInfo, downloadMedia, ytdl } = require('../utils/downloader');
const { addHistory } = require('../utils/storage');
const { renderDashboard, clearScreen } = require('../utils/render');

module.exports = async function renderDownload() {
    await renderDashboard();
    console.log(chalk.bgMagenta.white.bold(' MENU DOWNLOAD \n'));
    
    let url;
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'url',
                message: 'Masukkan URL YouTube:',
                validate: (input) => input ? true : 'URL tidak boleh kosong!'
            }
        ]);
        url = answers.url;
    } catch(e) { 
        return; 
    }
    
    const spinner = ora({ text: 'Mengambil metadata video...', color: 'cyan' }).start();
    let info;
    try {
        info = await getInfo(url);
        spinner.succeed('Metadata berhasil diambil!');
    } catch (err) {
        spinner.fail(`Gagal: ${err.message}`);
        return;
    }
    
    // Clear setelah loading selesai
    clearScreen();
    await renderDashboard();
    
    const title = info.videoDetails.title;
    const channel = info.videoDetails.author.name;
    const duration = info.videoDetails.lengthSeconds;
    const min = Math.floor(duration / 60);
    const sec = duration % 60;
    
    console.log(chalk.cyan('--- INFORMASI VIDEO ---'));
    console.log(chalk.white(`Judul   : ${title}`));
    console.log(chalk.white(`Channel : ${channel}`));
    console.log(chalk.white(`Durasi  : ${min}m ${sec}s\n`));
    
    const formats = info.formats;
    const audioFormats = ytdl.filterFormats(formats, 'audioonly');
    const videoFormats = ytdl.filterFormats(formats, 'video');
    
    const choices = [];
    if (audioFormats.length > 0) choices.push('🎵 Audio Saja (MP3)');
    if (videoFormats.length > 0) choices.push('🎥 Video (MP4)');
    
    if (choices.length === 0) {
        console.log(chalk.red('Tidak ada format yang tersedia.'));
        return;
    }
    
    const { type } = await inquirer.prompt([
        {
            type: 'list',
            name: 'type',
            message: 'Pilih format unduhan:',
            choices
        }
    ]);
    
    const isAudio = type.includes('Audio');
    const availableFormats = isAudio ? audioFormats : videoFormats;
    
    // Logika pemilihan kualitas yang tersedia
    let selectedFormat = availableFormats[0]; 
    if (!isAudio) {
        // Pilih resolusi tertinggi yang memiliki audio dan video gabungan
        const vidWithAudio = availableFormats.filter(f => f.hasAudio && f.hasVideo);
        if (vidWithAudio.length > 0) {
            selectedFormat = vidWithAudio.sort((a,b) => (b.height || 0) - (a.height || 0))[0];
        } else {
            selectedFormat = availableFormats[0];
        }
    }
    
    clearScreen();
    await renderDashboard();
    console.log(chalk.cyan('--- PROSES MENGUNDUH ---'));
    console.log(chalk.white(`Target: ${title}\n`));
    
    try {
        const result = await downloadMedia(url, info, selectedFormat, isAudio ? 'audio' : 'video');
        addHistory(result);
        
        clearScreen();
        await renderDashboard();
        
        console.log(chalk.green('✔ Download berhasil!'));
        console.log(chalk.cyan(`📁 Disimpan di:\n${result.path}\n`));
        
        if (!result.path.includes('/storage/emulated/0')) {
            console.log(chalk.yellow('Peringatan: File disimpan di folder internal CLI.'));
            console.log(chalk.yellow('Silakan jalankan "termux-setup-storage" agar file bisa disimpan di memori internal Android.'));
        }
        
    } catch (err) {
        console.log(chalk.red(`\n✖ Download gagal: ${err.message}`));
    }
};
