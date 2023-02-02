const axios = require('axios')

// find free proxies at https://free-proxy-list.net/#list
const proxies = [
  '52.30.164.26:80',
  '52.74.37.94:80',
  '8.210.83.33:80',
]

const getUrlHostAndPort = (url) => {
  const columnIndex = url.indexOf(':')

  const host = url.substring(0, columnIndex)
  const port = url.substring(columnIndex + 1)

  return { host, port }
}

module.exports = {
  processUrl: async (req, res) => {
    const { query: { url } } = req
    const { host, port } = getUrlHostAndPort(proxies[0])

    const { data: html, headers } = await axios.get(url, {
      proxy: {
        protocol: 'http',
        host,
        port
      }
    })
      .then(result => result)
      .catch(error => error)

    res.status(200).json({ html, headers })
  },
}