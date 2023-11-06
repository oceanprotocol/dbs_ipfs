const Quote = require("../models/quote.model.js");
const File = require("../models/upload.model.js");
const Nonce = require("../models/nonce.model.js");
const axios = require("axios");
const ethers = require("ethers");
const { errorResponse } = require("./error.js");

exports.upload = async (req, res) => {
  console.log(`upload request: ${JSON.stringify(req.body)}`);

  // Validate request
  if (!req.body) {
    errorResponse(req, res, null, 400, "Content can not be empty!");
    return;
  }

  // validate fields
  const quoteId = req.body.quoteId;
  if (typeof quoteId === "undefined") {
    errorResponse(req, res, null, 400, "Missing quoteId.");
    return;
  }
  if (typeof quoteId !== "string") {
    errorResponse(req, res, null, 400, "Invalid quoteId.");
    return;
  }

  const files =
    typeof req.body.files === "string" ? [req.body.files] : req.body.files;
  if (typeof files === "undefined") {
    errorResponse(req, res, null, 400, "Missing files field.");
    return;
  }
  if (typeof files !== "object" || !Array.isArray(files)) {
    errorResponse(req, res, null, 400, "Invalid files field.");
    return;
  }
  if (files.length == 0) {
    errorResponse(req, res, null, 400, "Empty files field.");
    return;
  }

  if (files.length > 64) {
    errorResponse(req, res, null, 400, "Too many files. Max 64.");
    return;
  }

  const cidRegex =
    /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})$/i;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (typeof file !== "object" || !file.ipfs_uri) {
      errorResponse(req, res, null, 400, `Invalid files field on index ${i}.`);
      return;
    }
    if (!file.ipfs_uri.startsWith("ipfs://")) {
      errorResponse(
        req,
        res,
        null,
        400,
        `Invalid protocol on index ${i}. Must be ipfs://<CID>`
      );
      return;
    }
    if (!cidRegex.test(file.ipfs_uri.substring(7))) {
      errorResponse(req, res, null, 400, `Invalid CID on index ${i}.`);
      return;
    }
  }

  if (typeof req.body.nonce === "undefined") {
    errorResponse(req, res, null, 400, "Missing nonce.");
    return;
  }

  const nonce = Number(req.body.nonce);

  if (isNaN(nonce)) {
    errorResponse(req, res, null, 400, "Invalid nonce.");
    return;
  }

  const signature = req.body.signature;
  if (typeof signature === "undefined") {
    errorResponse(req, res, null, 400, "Missing signature.");
    return;
  }
  if (typeof signature !== "string") {
    errorResponse(req, res, null, 400, "Invalid signature.");
    return;
  }

  // validate quote
  let quote;
  try {
    quote = Quote.get(quoteId);
    if (quote == undefined) {
      errorResponse(req, res, null, 404, "Quote not found.");
      return;
    }
  } catch (err) {
    errorResponse(req, res, err, 500, "Error occurred while validating quote.");
    return;
  }

  const userAddress = quote.userAddress;
  const message = ethers.utils.sha256(
    ethers.utils.toUtf8Bytes(quoteId + nonce.toString())
  );
  let signerAddress;
  try {
    signerAddress = ethers.utils.verifyMessage(message, signature);
  } catch (err) {
    errorResponse(req, res, err, 403, "Invalid signature.");
    return;
  }

  if (signerAddress != userAddress) {
    errorResponse(req, res, null, 403, "Invalid signature.");
    return;
  }

  let oldNonce;
  try {
    oldNonce = Nonce.get(userAddress)?.nonce || 0.0;
  } catch (err) {
    errorResponse(req, res, err, 500, "Error occurred while validating nonce.");
    return;
  }
  if (parseFloat(nonce) <= parseFloat(oldNonce)) {
    errorResponse(req, res, null, 403, "Invalid nonce.");
    return;
  }
  try {
    Nonce.set(userAddress, nonce);
  } catch (err) {
    errorResponse(req, res, err, 500, "Error occurred while storing nonce.");
    return;
  }

  // check status of quote
  if (quote.status != Quote.QUOTE_STATUS_WAITING) {
    if (quote.status == Quote.QUOTE_STATUS_UPLOAD_END) {
      errorResponse(req, res, null, 400, "Quote has been completed.");
      return;
    } else {
      errorResponse(req, res, null, 400, "Quote is being processed.");
      return;
    }
  }

  Quote.setStatus(quoteId, Quote.QUOTE_STATUS_UPLOAD_START);

  const requests = files.map((fileObj, index) => {
    console.log("fileObj.ipfs_uri", fileObj.ipfs_uri);

    const cid = fileObj.ipfs_uri.substring(7);
    const url = `${process.env.IPFS_GATEWAY}/api/v0/pin/add?arg=${cid}`;

    console.log("uploading cid:", cid);
    console.log("uploading file to IPFS endpoint:", url);

    return axios
      .post(url)
      .then((response) => {
        console.log(response.data);
        console.log("Pinning completed.");
        try {
          console.log("Updating cid in database");
          File.setCid(quoteId, index, cid);
        } catch (err) {
          console.error(
            `Error occurred while writing file cid to database: ${err?.name}: ${err?.message}. CID = ${cid}, file index = ${index}`
          );
          Quote.QUOTE_STATUS_UPLOAD_INTERNAL_ERROR;
          return;
        }
      })
      .catch((error) => {
        console.error("Error pinning file:", error.message);
        Quote.setStatus(quoteId, Quote.QUOTE_STATUS_UPLOAD_UPLOAD_FAILED);
        throw error;
      });
  });

  await Promise.all(requests);

  // send 200 only when all requests have successfully been sent
  console.log(`${req.path} response: 200`);
  res.status(200).send(null);

  console.log("Set status QUOTE_STATUS_UPLOAD_END");
  Quote.setStatus(quoteId, Quote.QUOTE_STATUS_UPLOAD_END);
};
