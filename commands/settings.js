const inquirer = require('inquirer');
const chalk = require('chalk');
const { getConfig, setConfig } = require('../utils/storage');
const { renderDashboard } = require('../utils/render');

module.exports = async function renderPengaturan() {
    await renderDashboard();
    console.log(chalk.bgGreen.black.bold(' PENGATURAN PENYIMPANAN \n'));
    
    const config = getConfig();
    console.log(chalk.gray(`Lokasi default saat ini: ${config.defaultLocation}\n`));
    
    const { location } = await inquirer.prompt([
        {
            type: 'list',
            name: 'location',
            message: 'Pilih lokasi penyimpanan default di Internal Storage:',
            choices: [
                'Download',
                'Music',
                'Movies',
                'Folder Kustom'
            ]
        }
    ]);
    
    let finalLocation = location;
    if (location === 'Folder Kustom') {
        const { custom } = await inquirer.prompt([
            {
                type: 'input',
                name: 'custom',
                message: 'Masukkan path absolut (contoh: /storage/emulated/0/MyFolder):'
            }
        ]);
        finalLocation = custom;
    }
    
    setConfig({ defaultLocation: finalLocation });
    
    console.log(chalk.green(`\n✔ Lokasi default berhasil diubah ke: ${finalLocation}`));
};
