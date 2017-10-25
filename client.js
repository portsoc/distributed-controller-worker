'use strict';

const secretKey = encodeURIComponent((process.argv[2] || '').trim());

if (secretKey.length < 6) {
  console.error('Error: secret key too short');
  process.exit(-1);
}

const serverIP = (process.argv[3] || '').trim();

if (serverIP.length < 1) {
  console.error('Error: no server IP address provided');
  process.exit(-1);
}

const jobUrl = `http://${serverIP}/job?key=${secretKey}`;
const resultUrl = `http://${serverIP}/result?key=${secretKey}`;

const fetch = require('node-fetch');

const startTime = Date.now();
let doneCount = 0;

async function getFirstJob() {
  let job = await fetch(jobUrl);
  if (!job.ok) throw new Error(`cannot fetch: ${job.status} ${job.statusText}`);
  job = await job.json();
  return doJob(job);
}

getFirstJob().catch((err) => { console.error('Error: ', err); });

async function doJob(job) {
  switch (job.type) {
    case 'sumsqrt': return sendResult(doSumSqrt(job));
    default: throw new Error(`unknown job type ${job.type}, bailing out`);
  }
}

const headers = { 'content-type': 'application/json' };

async function sendResult(result) {
  // console.log('sending result', result);
  doneCount += 1;
  try {
    let job = await fetch(resultUrl, { method: 'POST', body: JSON.stringify(result), headers });
    if (job.status === 204) return finish('no more jobs, done');
    if (!job.ok) throw new Error(`cannot post: ${job.status} ${job.statusText}`);
    job = await job.json();
    return doJob(job);
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      return finish('server unreachable, presumed finished');
    }

    throw e;
  }
}

function doSumSqrt(job) {
  if (typeof job.start !== 'number' ||
      typeof job.count !== 'number' ||
      !Number.isInteger(job.start) ||
      !Number.isInteger(job.count) ||
      job.count < 1 ||
      job.start < 0) {
    throw new Error('invalid job', job);
  }
  console.log('job', job);
  // console.time('job');
  let sumsqrt = 0;
  const end = job.start + job.count;
  for (let i=job.start; i<end; i+=1) {
    sumsqrt += Math.sqrt(i);
  }
  // console.timeEnd('job');
  return { id: job.id, sumsqrt };
}

function finish(msg) {
  console.log(msg);
  const time = Date.now() - startTime;
  console.log(`done ${doneCount} jobs in ${time}ms (${time/doneCount}ms per job).`);
}
