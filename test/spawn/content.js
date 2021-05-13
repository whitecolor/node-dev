const { readFile, writeFile } = require('fs/promises');
const { join } = require('path');
const tap = require('tap');

const { spawn } = require('../utils');

const path = join(__dirname, '..', 'fixture', 'content', 'message.js');

const replaceInFile = (path, from, to) =>
  readFile(path, 'utf-8').then(contents => writeFile(path, contents.replace(from, to)));

tap.test('Does not restart when content does not change', t => {
  replaceInFile(path, 'revert', 'change').then(() => {
    const ps = spawn('--content=content/message.js content', out => {
      if (out.includes('change content/message.js')) {
        setTimeout(() => {
          ps.kill('SIGTERM');
          t.end();
        }, 1500);
        replaceInFile(path, 'change', 'change');
        return () => ({ exit: t.fail.bind(t) });
      }
    });
  });
});

tap.test('Restarts when content changes', t => {
  replaceInFile(path, 'revert', 'change').then(() => {
    spawn('--content=content/message.js content', out => {
      if (out.includes('change content/message.js')) {
        replaceInFile(path, 'change', 'revert');
        return out2 => {
          if (out2.includes('revert content/message.js')) {
            replaceInFile(path, 'revert', 'change');
            return out3 => {
              if (out3.match('change content/message.js')) {
                return { exit: t.end.bind(t) };
              }
            };
          }
        };
      }
    });
  });
});
