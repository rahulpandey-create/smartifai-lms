const { getAnalytics } = require('../services/analyticsService')

async function analytics(req, res) {
  const data = await getAnalytics(req.validatedQuery || req.query)
  return res.json({ success: true, data })
}

module.exports = { analytics }
