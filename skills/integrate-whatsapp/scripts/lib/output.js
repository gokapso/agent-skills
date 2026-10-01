const { printJson } = require('./security');

function printOk(data) {
  printJson({ ok: true, data });
}

function printError(message, details) {
  printJson({ ok: false, error: { message, details } }, { error: true });
}

module.exports = {
  printOk,
  printError
};
