const isValidUrl = require('../helpers/is-valid-url')

module.exports = {
  validateUrl: (req, res, next) => {
    const { query: { url } } = req

    const isValid = isValidUrl(url)

    if (!isValid) {
      return res.status(404).json({ message: 'The URL you provided is invalid' })
    }

    next()
  }
}