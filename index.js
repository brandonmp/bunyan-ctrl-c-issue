const asyncThrottle = require('async-throttle');
const bunyan = require('bunyan');
const _ = require('lodash');

const MAX_WORKERS = 5;
let IS_KILLSWITCH_ACTIVE = false;
let NUM_WORKERS_SHUTDOWN = 0;

const SHOULD_IGNORE_EPIPE = false;

const log = bunyan.createLogger({
  name: 'issue-demo',
  serializers: {
    err: bunyan.stdSerializers.err,
  },
  streams: [
    {
      stream: process.stdout,
      level: 'info',
    },
  ],
});

const ignoreEpipe = () => {
  process.stdout.on('error', err => {
    if (err.code === 'EPIPE') {
      // ignore
    } else {
      throw err;
    }
  });
};

/*** mimic async task */
const doTask = () => {
  log.info('TASK STARTED');
  return new Promise(resolve =>
    setTimeout(
      () => {
        log.info('TASK COMPLETED');
        resolve();
      },
      Math.random() * 10 * 1000
    ));
};

/*** Put worker in extra long wait state so everyone else can finish task */
const killWorker = () => {
  NUM_WORKERS_SHUTDOWN += 1;
  log.info(
    `WORKER HAS SHUTDOWN, ${MAX_WORKERS - NUM_WORKERS_SHUTDOWN} remaining`
  );

  /* Once all workers have stopped, shut it down */
  if (MAX_WORKERS === NUM_WORKERS_SHUTDOWN) {
    log.info('ALL WORKERS SHUTDOWN');
    process.exit(0);
  }
  return new Promise(resolve => setTimeout(resolve, 15 * 1000 * 60));
};

/*** Start some workers to do some async task*/
const startWorkers = () => {
  // this will ensure only x workers are going at once.
  const throttle = asyncThrottle(MAX_WORKERS);
  const tasks = _.range(5000);
  Promise.all(
    tasks.map(() => {
      throttle(() => IS_KILLSWITCH_ACTIVE === true ? killWorker() : doTask());
    })
  );
};

/*** intercept ctrl+c and instead start the graceful shutdown */
process.on('SIGINT', () => {
  if (SHOULD_IGNORE_EPIPE === true) ignoreEpipe();
  log.info({ event: 'KILL SIGNAL RECEIVED, STARTING WORKER SHUTDOWN' });
  setTimeout(() => setTimeout(() => process.exit(0), 20 * 1000));
  IS_KILLSWITCH_ACTIVE = true;
});

startWorkers();
