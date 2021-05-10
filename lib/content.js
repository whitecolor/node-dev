const { createHash } = require('crypto');
const { createReadStream } = require('fs');

const getMD5 = file =>
  new Promise((resolve, reject) => {
    const hash = createHash('md5');
    const stream = createReadStream(file);

    stream.on('close', () => resolve(hash.digest('hex')));
    stream.on('data', hash.update.bind(hash));
    stream.on('error', reject);
  });

const contentFactory = prefixes => {
  const pathMatch = file => prefixes.some(prefix => file.startsWith(prefix));

  const contentMap = {};

  const contentChange = file =>
    getMD5(file)
      .catch(() => null)
      .then(hash => {
        const prevHash = contentMap[file];
        contentMap[file] = hash;
        return hash !== prevHash;
      });

  return file => new Promise(resolve => resolve(!pathMatch(file) || contentChange(file)));
};

module.exports = { contentFactory };
