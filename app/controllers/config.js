const { URL } = require("url");

const checkConfig = () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (privateKey == null) {
    console.log("PRIVATE_KEY environment variable not set");
    return false;
  }

  const sqlitePath = process.env.SQLITE_DB_PATH;
  if (sqlitePath == null) {
    console.log("SQLITE_DB_PATH environment variable not set");
    return false;
  }

  const port = process.env.PORT;
  if (port != null && isNaN(port)) {
    console.log("PORT environment variable should be a number");
    return false;
  }

  const registrationInterval = process.env.REGISTRATION_INTERVAL;
  if (registrationInterval != null && isNaN(registrationInterval)) {
    console.log(
      "REGISTRATION_INTERVAL environment variable should be the number of milliseconds between registration calls"
    );
    return false;
  }

  const dbsUri = process.env.DBS_URI;
  if (dbsUri == null) {
    console.log("DBS_URI environment variable not set");
    return false;
  }
  if (dbsUri != "DEBUG") {
    try {
      const dbsUrl = new URL(dbsUri);
      if (dbsUrl.protocol != "http:" && dbsUrl.protocol != "https:") {
        console.log("DBS_URI should be http or https");
        return false;
      }
    } catch (err) {
      console.log("DBS_URI is invalid");
      return false;
    }
  }

  const selfUri = process.env.SELF_URI;
  if (selfUri == null) {
    console.log("SELF_URI environment variable not set");
    return false;
  }
  try {
    const selfUrl = new URL(selfUri);
    if (selfUrl.protocol != "http:" && selfUrl.protocol != "https:") {
      console.log("SELF_URI should be http or https");
      return false;
    }
  } catch (err) {
    console.log("SELF_URI is invalid");
    return false;
  }

  const ipfsUri = process.env.IPFS_GATEWAY;
  if (ipfsUri == null) {
    console.log("IPFS_GATEWAY environment variable not set");
    return false;
  }
  try {
    const ipfsUrl = new URL(ipfsUri);
    if (ipfsUrl.protocol != "http:" && ipfsUrl.protocol != "https:") {
      console.log("IPFS_GATEWAY should be http or https");
      return false;
    }
  } catch (err) {
    console.log("IPFS_GATEWAY is invalid");
    return false;
  }

  const maxUploadSize = process.env.MAX_UPLOAD_SIZE;
  if (maxUploadSize == null) {
    console.log("MAX_UPLOAD_SIZE environment variable not set");
    return false;
  }
  if (isNaN(maxUploadSize)) {
    console.log(
      "MAX_UPLOAD_SIZE environment variable should be a number, in bytes"
    );
    return false;
  }

  return true;
};

module.exports = { checkConfig };
