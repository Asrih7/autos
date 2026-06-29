const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const configJsonPath = path.join(__dirname, '../apps/mnv-autos-ng/src/assets/config/config.json');
const configJson = JSON.parse(fs.readFileSync(configJsonPath, 'utf8'));

const appInfo = {
  name: packageJson.name,
  version: packageJson.version,
  production: configJson.production
};

const outputPath = path.join(__dirname, '../apps/mnv-autos-ng/src/assets/config/app-info.json');
fs.writeFileSync(outputPath, JSON.stringify(appInfo, null, 2), 'utf8');
