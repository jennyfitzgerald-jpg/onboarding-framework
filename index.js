// Railway entry point - redirects to the actual framework directory
process.chdir('.cursor/projects/Frameworks');
console.log('Changed directory to:', process.cwd());
require('./server.js');
