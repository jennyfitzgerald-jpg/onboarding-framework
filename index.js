// Railway entry point - redirects to the actual framework directory
const path = require('path');
const fs = require('fs');

const frameworkPath = path.join(__dirname, '.cursor', 'projects', 'Frameworks');

console.log('Root entry point starting...');
console.log('Current directory:', __dirname);
console.log('Framework path:', frameworkPath);
console.log('Framework path exists:', fs.existsSync(frameworkPath));

// Verify framework directory exists
if (!fs.existsSync(frameworkPath)) {
    console.error('ERROR: Framework directory does not exist:', frameworkPath);
    console.error('Current directory contents:', fs.readdirSync(__dirname));
    process.exit(1);
}

// Verify server.js exists
const serverPath = path.join(frameworkPath, 'server.js');
if (!fs.existsSync(serverPath)) {
    console.error('ERROR: server.js not found at:', serverPath);
    console.error('Framework directory contents:', fs.readdirSync(frameworkPath));
    process.exit(1);
}

// Change to framework directory
process.chdir(frameworkPath);
console.log('Changed directory to:', process.cwd());

// Load the server using absolute path
try {
    require(serverPath);
    console.log('Server module loaded successfully');
} catch (error) {
    console.error('Error loading server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
}
