'use strict';

const secretKey = (process.argv[2] || '').trim();

if (secretKey.length < 6) {
  console.error('Error: secret key too short');
  process.exit(-1);
}

const express = require('express');
const app = express();

// check that every request has the ?key= parameter
app.use((req, res, next) => {
  if (req.query.key !== secretKey) {
    res.sendStatus(403);
    console.warn(`${new Date().toISOString()} access attempt with the wrong key: '${req.query.key}'`);
  } else {
    next();
  }
});

const jobs = [];
const done = [];

const JOBSIZE = 1e8;
const JOBCOUNT = 100;

// generate jobs
for (let i=0; i<JOBCOUNT; i+=1) {
  jobs.push({
    id: i,
    type: 'sumsqrt',
    start: i * JOBSIZE,
    count: JOBSIZE,
  });
}

// get the next job from the queue
// given jobs go to the back of the queue in case the worker is slow or dies
app.get('/job', getJob);
app.post('/result', express.json(), postResult);

function status() {
  process.stdout.write(`${done.length}/${JOBCOUNT} done          \r`);
}

function getJob(req, res) {
  if (jobs.length === 0) {
    // no more jobs to do
    res.sendStatus(204);
    finished();
  } else {
    const job = jobs.shift();
    res.json(job);
    jobs.push(job);
  }
}

function postResult(req, res) {
  const data = req.body;
  // search from the back because the recently given jobs are there
  for (let i=jobs.length-1; i>=0; i-=1) {
    if (data.id === jobs[i].id) {
      // put the job in done, add the result, remove it from jobs
      done.push(jobs[i]);
      jobs[i].result = data;
      jobs.splice(i, 1);
      status();
      break;
    }
  }

  // whether or not the job for the result was found, send the next job
  getJob(req, res);
}

function finished() {
  server.close();
  let sum = 0;
  for (const job of done) {
    sum += job.result.sumsqrt;
  }
  console.log(`\nFinished: the sum of square roots of 0..${JOBCOUNT}*${JOBSIZE}-1 is ${sum}`);
  process.exit(0);
}

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
  status();
});
