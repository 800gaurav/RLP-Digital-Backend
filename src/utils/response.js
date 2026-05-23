function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function message(res, text, status = 200) {
  return res.status(status).json({ success: true, message: text });
}

module.exports = { ok, message };
