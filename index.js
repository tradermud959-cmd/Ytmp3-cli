const { clearScreen, renderDashboard } = require('./utils/render');
const inquirer = require('inquirer');
const chalk = require('chalk');

const renderDownload = require('./commands/download');
const renderRiwayat = require('./commands/history');
const renderPengaturan = require('./commands/settings');

async function renderMenu() {
    const { menu } = await inquirer.prompt([
        {
            type: 'list',
            name: 'menu',
            message: 'Pilih Menu Utama:',
            choices: [
                '1. Download Video/Audio',
                '2. Riwayat Download',
                '3. Pengaturan Penyimpanan',
                '4. Keluar'
            ]
        }
    ]);
    return menu;
}

// Global error handler untuk mencegah aplikasi crash tiba-tiba
process.on('uncaughtException', (err) => {
    console.error(chalk.red('\nTerjadi kesalahan tidak terduga:'), err.message);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error(chalk.red('\nTerjadi kesalahan asinkron:'), err.message);
});

// Entry Point Render Loop
async function render() {
    while (true) {
        clearScreen();
        await renderDashboard();
        
        const choice = await renderMenu();
        
        clearScreen();
        if (choice.includes('1')) {
            await renderDownload();
        } else if (choice.includes('2')) {
            await renderRiwayat();
        } else if (choice.includes('3')) {
            await renderPengaturan();
        } else {
            console.log(chalk.cyan('\nSayonara! Terima kasih telah menggunakan aplikasi ini.\n'));
            process.exit(0);
        }
        
        const { back } = await inquirer.prompt([{ 
            type: 'input', 
            name: 'back', 
            message: chalk.gray('Tekan Enter untuk kembali ke menu utama...') 
        }]);
    }
}

// Jalankan aplikasi
render();
