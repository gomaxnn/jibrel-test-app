'use strict'

module.exports = {
    redisUrl: process.env.REDIS_URL,
    apiPort: process.env.API_PORT || 7000,
    wssPort: process.env.WSS_PORT || 7100
}
