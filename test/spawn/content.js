const { readFile, writeFile } = require('fs/promises');
const { join } = require('path');
const tap = require('tap');

const { spawn, touchFile } = require('../utils');

const replaceInFile = (path, from, to) =>
  readFile(path, 'utf-8').then(contents => writeFile(path, contents.replace(from, to)));

tap.test('should not restart with --content on file touch', t => {
  const ps = spawn('--content=message-content.js server.js', out => {
    if (out.match(/touch message.js/)) {
      touchFile('message-content.js');
      const exitTimeout = setTimeout(() => {
        ps.kill('SIGTERM');
        t.end();
      }, 1500);
      return out2 => {
        clearTimeout(exitTimeout);
        if (out2.match(/Restarting/)) return { exit: t.fail.bind(t) };
      };
    }
  });
});

tap.test('should restart the server with --content twice', t => {
  const path = join(__dirname, '..', 'fixture', 'message-content.js');

  replaceInFile(path, 'revert', 'change').then(() => {
    spawn('--content=message-content.js server.js', out => {
      if (out.match(/change message-content.js/)) {
        replaceInFile(path, 'change', 'revert').then(() => console.log('changed to revert'));
        return out2 => {
          if (out2.match(/Restarting/)) {
            replaceInFile(path, 'revert', 'change').then(() => console.log('changed back'));
            return out3 => {
              if (out3.match(/Restarting/)) {
                return { exit: t.end.bind(t) };
              }
            };
          }
        };
      }
    });
  });
});
