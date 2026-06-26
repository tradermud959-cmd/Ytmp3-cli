const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/config.json');
const historyPath = path.join(__dirname, '../data/history.json');
const tempDir = path.join(__dirname, '../downloads');

// Inisialisasi folder dan file jika belum ada
[path.dirname(configPath), path.dirname(historyPath), tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ defaultLocation: 'Download' }, null, 2));
}

if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify([], null, 2));
}

function getConfig() {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function setConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getHistory() {
    return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
}

function addHistory(record) {
    const history = getHistory();
    history.push({ ...record, date: new Date().toISOString() });
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function getFinalPath(filename) {
    const config = getConfig();
    const location = config.defaultLocation;
    
    // Basis Internal Storage Android di Termux
    let basePath = '/storage/emulated/0';
    let targetDir = '';
    
    if (location === 'Music') targetDir = path.join(basePath, 'Music');
    else if (location === 'Download') targetDir = path.join(basePath, 'Download');
    else if (location === 'Movies') targetDir = path.join(basePath, 'Movies');
    else targetDir = location; // Custom path
    
    // Pengecekan Izin Termux Setup Storage
    if (!fs.existsSync(basePath)) {
        // Fallback ke folder internal CLI jika izin belum diberikan
        targetDir = tempDir;
    } else {
        // Jika folder tujuan belum ada, buat otomatis
        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (e) {
                 // Fallback jika tidak punya izin menulis ke folder tersebut
                 targetDir = tempDir;
            }
        }
    }
    
    return path.join(targetDir, filename);
}

function moveFile(source, dest) {
    try {
        fs.renameSync(source, dest);
    } catch (e) {
        // Fallback menggunakan copy & unlink jika rename lintas partisi gagal
        fs.copyFileSync(source, dest);
        fs.unlinkSync(source);
    }
}

module.exports = { getConfig, setConfig, getHistory, addHistory, getFinalPath, moveFile, tempDir };
