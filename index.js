// Railway entry point - redirects to the actual framework directory
const path = require('path');
const frameworkPath = path.join(__dirname, '.cursor', 'projects', 'Frameworks');

console.log('Root entry point starting...');
console.log('Current directory:', __dirname);
console.log('Framework path:', frameworkPath);

// Change to framework directory
process.chdir(frameworkPath);
console.log('Changed directory to:', process.cwd());

// Load the server
try {
    require('./server.js');
    console.log('Server module loaded successfully');
} catch (error) {
    console.error('Error loading server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
}
