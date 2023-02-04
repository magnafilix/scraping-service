const HttpsWithProxyClientService = require('../services/https-with-proxy-client')

module.exports = {
  getUrl: async (req, res) => {
    const { query: { url } } = req

    const httpsClient = new HttpsWithProxyClientService();

    try {
      const { body, headers, status } = await httpsClient.getURL(url);
      return res.status(status).json({ body, headers })
    } catch (err) {
      if (err === 'Failed to fetch data in time!') {
        return res.status(500).json({ message: err })
      }
      console.log(err, '-- try catch block --')
      return res.json({ message: err })
    }
  }
}