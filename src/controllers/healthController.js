function getHealth(req, res) {
  res.json({ ok: true, status: 'up', time: new Date().toISOString() });
}

module.exports = {
  getHealth,
};
