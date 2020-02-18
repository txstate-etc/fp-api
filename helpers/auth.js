module.exports = {
  authorize: function(req,res,next) {
    if (req.get('X-Secret-Key') !== process.env.FPAPI_SECRET) {
      const message = process.env.NODE_ENV === 'production' ? 'Authentication failure.' : 'Secret key required for /profiles endpoint'
      return res.status(401).send(message)
    }
    next()
  }
}