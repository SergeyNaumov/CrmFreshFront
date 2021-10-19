module.exports = {
  publicPath: process.env.BUILD_MODE === 'trade'
    ? '/CrmFreshDev'
    : '/'
}