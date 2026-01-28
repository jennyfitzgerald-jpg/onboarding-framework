// Railway entry point - loads server from subdirectory
const path = require('path');
const fs = require('fs');

// Find the framework directory
const frameworkPath = path.join(__dirname, '.cursor', 'projects', 'Frameworks');
const serverPath = path.join(frameworkPath, 'server.js');

console.log('=== Railway Entry Point ===');
console.log('Root directory:', __dirname);
console.log('Framework path:', frameworkPath);
console.log('Server path:', serverPath);
console.log('Framework exists:', fs.existsSync(frameworkPath));
console.log('Server exists:', fs.existsSync(serverPath));

// Verify paths
if (!fs.existsSync(frameworkPath)) {
    console.error('ERROR: Framework directory not found');
    console.error('Root contents:', fs.readdirSync(__dirname).slice(0, 10));
    process.exit(1);
}

if (!fs.existsSync(serverPath)) {
    console.error('ERROR: server.js not found');
    console.error('Framework contents:', fs.readdirSync(frameworkPath).slice(0, 10));
    process.exit(1);
}

// Change to framework directory so relative paths work
process.chdir(frameworkPath);
console.log('Changed working directory to:', process.cwd());

// Load and start the server
console.log('Loading server module...');
try {
    // Use absolute path to ensure we get the right file
    delete require.cache[require.resolve(serverPath)];
    require(serverPath);
    console.log('✓ Server module loaded successfully');
} catch (error) {
    console.error('✗ Failed to load server:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
