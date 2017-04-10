const asyncThrottle = require('async-throttle');
const _ = require('lodash');
const bunyan = require('bunyan');
const micro = require('micro');

// run basic server so now keeps this alive
const server = micro(() => new Promise(resolve => resolve('Welcome to micro')));

server.listen(3000);

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

const THROTTLE_LIMIT = 5;
let WORKERS_SHOULD_STOP = false;
let workersStopped = 0;

const reportWorkerStop = () => {
  log.info({
    event: 'KILLING WORKER',
    remaining: THROTTLE_LIMIT - workersStopped,
  });
  workersStopped += 1;
  if (workersStopped === THROTTLE_LIMIT) {
    log.info({ event: 'SHUTDOWN COMPLETE' });
    process.exit(0);
  }
};

const killWorker = async () => {
  reportWorkerStop();
  log.info({ event: 'WORKER DEAD' });
  return new Promise(resolve => setTimeout(() => resolve(), 1000 * 60 * 10));
};

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

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', () => {
  log.info({ event: 'STARTING SHUTDOWN', workers: THROTTLE_LIMIT });
  WORKERS_SHOULD_STOP = true;
});

const startWorkers = async () => {
  const throttle = asyncThrottle(THROTTLE_LIMIT);
  const tasks = _.range(5000);

  await Promise.all(
    tasks.map(file =>
      throttle(async () => {
        if (WORKERS_SHOULD_STOP === true) await killWorker();
        else await doTask();
      }))
  );
};

startWorkers();
