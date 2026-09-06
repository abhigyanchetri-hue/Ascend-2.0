// Wraps async route handlers so any thrown error is forwarded to the
// central error handler in server.js. Without this, a rejected promise
// inside a controller would leave the request hanging forever.
module.exports = (handlerFn) => (req, res, next) =>
  Promise.resolve(handlerFn(req, res, next)).catch(next);
