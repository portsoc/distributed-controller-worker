const address = require('address');
const fetch = require('node-fetch');
const logging = require('@google-cloud/logging')();

const logMetadata = { resource: { type: 'global' } };

async function findLogPrefix() {
  let logPrefix = address.ip() + ' ';
  try {
    const googleInstanceNameUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/name';
    const metadata = await fetch(googleInstanceNameUrl, { headers: { 'Metadata-flavor': 'Google' } });
    if (metadata.ok) logPrefix = await metadata.text() + ' ';
  } catch (e) {
    // do nothing, fetching metadata didn't work, we'll use IP address as log prefix
  }
  return logPrefix;
}

module.exports = function (logName) {
  const logPrefixPromise = findLogPrefix();
  const logger = logging.log(logName);

  return async function log(msg) {
    const logPrefix = await logPrefixPromise;
    return logger.info(logger.entry(logMetadata, logPrefix + msg));
  };
};
