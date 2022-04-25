import { execaSync } from 'execa';

let spawnSync = execaSync;

export default {
  // TODO remove when es6 module mocking is supported
  setSpawnSync(spawn) {
    spawnSync = spawn;
  },

  id(input) {
    const done = this.async();

    if (typeof input === 'number') {
      const result = spawnSync('leetcode', ['show', input]);
      if (result.stdout.indexOf('Problem not found!') > -1) {
        done('Invalid Problem ID');
      } else {
        done(null, true);
      }
      return;
    }

    done('Invalid input');
  },
};
