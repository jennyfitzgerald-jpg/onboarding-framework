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
    try {
        console.error('Root contents:', fs.readdirSync(__dirname).slice(0, 10));
    } catch (e) {
        console.error('Could not read root directory');
    }
    process.exit(1);
}

if (!fs.existsSync(serverPath)) {
    console.error('ERROR: server.js not found');
    try {
        console.error('Framework contents:', fs.readdirSync(frameworkPath).slice(0, 10));
    } catch (e) {
        console.error('Could not read framework directory');
    }
    process.exit(1);
}

// Add both root and framework node_modules to module path
const rootNodeModules = path.join(__dirname, 'node_modules');
const frameworkNodeModules = path.join(frameworkPath, 'node_modules');

// Modify NODE_PATH to include both locations
const modulePaths = [];
if (fs.existsSync(rootNodeModules)) {
    modulePaths.push(rootNodeModules);
    console.log('Found root node_modules');
}
if (fs.existsSync(frameworkNodeModules)) {
    modulePaths.push(frameworkNodeModules);
    console.log('Found framework node_modules');
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
    console.error('Error type:', error.constructor.name);
    if (error.code) {
        console.error('Error code:', error.code);
    }
    console.error('Stack:', error.stack);
    process.exit(1);
}
