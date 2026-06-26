const Table = require('cli-table3');
const chalk = require('chalk');
const { getHistory } = require('../utils/storage');
const { renderDashboard, renderStatistik, renderGrafik } = require('../utils/render');

module.exports = async function renderRiwayat() {
    await renderDashboard();
    console.log(chalk.bgBlue.white.bold(' RIWAYAT DOWNLOAD \n'));
    
    const history = getHistory();
    if (history.length === 0) {
        console.log(chalk.yellow('Belum ada riwayat download.'));
        return;
    }
    
    renderStatistik(history);
    renderGrafik(history);
    
    // Responsif untuk layar Termux Android dengan pembatasan panjang kolom
    const table = new Table({
        head: [chalk.cyan('Judul'), chalk.cyan('Tipe'), chalk.cyan('Tanggal')],
        colWidths: [30, 10, 20],
        wordWrap: true
    });
    
    // Sortir terbaru, ambil 10 terakhir
    history.sort((a, b) => new Date(b.date) - new Date(a.date))
           .slice(0, 10)
           .forEach(h => {
               const shortTitle = h.title && h.title.length > 25 ? h.title.substring(0, 25) + '...' : (h.title || 'Unknown');
               table.push([
                   shortTitle,
                   h.type || 'Unknown',
                   new Date(h.date).toLocaleDateString()
               ]);
           });
           
    console.log(table.toString());
};
