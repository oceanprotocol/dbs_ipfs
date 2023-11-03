const sql = require("./db.js");

// constructor
const File = function (file) {
  this.quoteId = file.quoteId;
  this.index = file.index;
  this.length = file.length;
  this.hash = file.hash;
  this.cid = file.cid;
};

File.get = (quoteId, index) => {
  const query = `
		SELECT *
		FROM files
		WHERE "quoteId" = ?
		AND "index" = ?;
	`;
  return sql.prepare(query).get([quoteId, index]);
};

File.setCid = (quoteId, index, cid) => {
  const query = `
		UPDATE files SET cid = ?
		WHERE "quoteId" = ?
		AND "index" = ?;
	`;
  return sql.prepare(query).run([cid, quoteId, index]);
};

module.exports = File;
