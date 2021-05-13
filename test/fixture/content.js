const message = require('./content/message.js');

console.log(message);

setTimeout(() => process.exit(1), 10000);

process.once('SIGTERM', () => process.exit());
process.once('beforeExit', () => console.log('exit'));
