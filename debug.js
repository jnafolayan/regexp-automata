let DEBUG = true;
const debug = {
  log() {
    if (DEBUG) {
      console.log(...arguments);
    }
  },
};
