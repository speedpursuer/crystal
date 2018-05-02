const HttpsProxyAgent = require ('https-proxy-agent')
const singleton = Symbol()
const proxyURL = 'http://127.0.0.1:1087'

class HttpProxy {
    constructor(enforcer) {
        if (enforcer !== singleton) {
            throw new Error('Cannot construct HttpProxy singleton')
        }
        this.agent = this._initAgent()
    }

    _initAgent() {
        if(process.env.NODE_ENV === 'development') {
            return new HttpsProxyAgent(proxyURL)
        }
        return null
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new HttpProxy(singleton)
        }
        return this[singleton]
    }

    get httpsProxyAgent() {
        return this.agent
    }

}
module.exports = HttpProxy