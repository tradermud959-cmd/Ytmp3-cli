const { cyberpunk, cyberBox, figletAsync } = require('./theme');
const chalk = require('chalk');

function clearScreen() {
    process.stdout.write('\x1Bc');
}

async function renderDashboard() {
    const title = await figletAsync('YT CLI', { font: 'Slant' });
    console.log(cyberBox(cyberpunk(title) + '\n\n' + chalk.gray('Cyberpunk Termux Downloader v2.0')));
}

function renderStatistik(history) {
    console.log(chalk.cyan(`Total Download Berhasil: ${history.length}`));
}

function renderGrafik(history) {
    const audioCount = history.filter(h => h.type === 'audio').length;
    const videoCount = history.filter(h => h.type === 'video').length;
    console.log(chalk.magenta('\nGrafik Tipe Unduhan:'));
    console.log(chalk.white(`Audio : ${'\u2588'.repeat(audioCount)} (${audioCount})`));
    console.log(chalk.white(`Video : ${'\u2588'.repeat(videoCount)} (${videoCount})\n`));
}

module.exports = { clearScreen, renderDashboard, renderStatistik, renderGrafik };
