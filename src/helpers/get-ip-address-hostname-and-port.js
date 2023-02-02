module.exports = (ipAddress) => {
  const columnIndex = ipAddress.indexOf(':')

  const hostname = ipAddress.substring(0, columnIndex)
  const port = ipAddress.substring(columnIndex + 1)

  return { hostname, port }
}