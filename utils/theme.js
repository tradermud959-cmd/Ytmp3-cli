const gradient = require('gradient-string');
const figlet = require('figlet');
const boxen = require('boxen');

const cyberpunk = gradient(['#FF003C', '#00E5FF', '#FCEE0A']);
const cyberBox = (text) => boxen(text, { 
    padding: 1, 
    margin: 1, 
    borderStyle: 'double', 
    borderColor: 'cyan', 
    align: 'center' 
});

module.exports = {
  cyberpunk,
  cyberBox,
  figletAsync: require('util').promisify(figlet)
};
