// Entry point for Railway - starts the server
console.log('Starting application from index.js...');
console.log('Current directory:', __dirname);
console.log('Node version:', process.version);

try {
    require('./server.js');
    console.log('Server module loaded successfully');
} catch (error) {
    console.error('Error loading server.js:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
}
