module.exports = (ip = '') => {
  const columnIndex = ip.indexOf(':')

  const host = ip.substring(0, columnIndex)
  const port = ip.substring(columnIndex + 1)

  return { host, port }
}