const HttpsProxyClientService = require('../services/https-proxy-client')

module.exports = {
  getUrl: async (req, res) => {
    const { query: { url } } = req

    const httpsProxyClient = new HttpsProxyClientService();

    try {
      const { body, headers, status } = await httpsProxyClient.getURL(url);
      return res.status(status).json({ body, headers })
    } catch (err) {
      console.log(err, '-- try catch block --')
      return res.status(500).json({ message: err })
    }
  }
}