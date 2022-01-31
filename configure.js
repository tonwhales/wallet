const fs = require('fs');
const child_process = require('child_process');

// Read version
const version = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf-8')).version;

// Bump version code
let versionCode = parseInt(fs.readFileSync(__dirname + '/VERSION_CODE', 'utf-8'), 10);
versionCode++;
fs.writeFileSync(__dirname + '/VERSION_CODE', versionCode.toString());

// Update plist
child_process.execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${versionCode}" ${__dirname + '/ios/wallet/Info.plist'}`);
child_process.execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${version}" ${__dirname + '/ios/wallet/Info.plist'}`);

// Add updated files to git
child_process.execSync(`git add ${__dirname + '/ios/wallet/Info.plist'}`);
child_process.execSync(`git add ${__dirname + '/VERSION_CODE'}`);