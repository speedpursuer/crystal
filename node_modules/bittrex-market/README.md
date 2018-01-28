# bittrex-market
This module provides access to orderbooks and market events (fills) in real time on the Bittrex exchange.

# Requirements
Node.js >= 6.0.0

# Install
This library is published on npm.

```
$ npm install --save bittrex-market
```

# Example
```js
const MarketManager = require('bittrex-market')

//set to true if you want to replay historic trades
const marketManager = new MarketManager(false)

//access the desired market
marketManager.market('BTC-ETH', (err, ethereum) => {
    //print the fulfilled orders to stdout in real time
    //in case the connection drops and there is a reconnect
    //all fills from the past get replayed
    ethereum.on('fills', console.log)

    //fires each time changes have been applied to the orderbook, and prints the current state of the orderbook
    ethereum.on('orderbookUpdated', () => {
        //print the asks side of the current order book state
        //the format is an array of [ rate, quantity ]
        //i.e. [[ 0.10994992, 4.37637934 ], [ 0.10996992, 10.47637934 ] ...]
        console.log(ethereum.asks)

        //same thing for the bids side
        console.log(ethereum.bids)
    })

    //fires each time changes have been applied to the orderbook, and prints the changes only
    sides = ['asks', 'bids']
    eventTypes = ['removed', 'inserted', 'updated']

    sides.forEach((side) => {
        eventTypes.forEach((type) => {
            bitcoin.on(`orderbook.diff.${side}.${type}`, (event) => {
                console.log(side, type, event)
            })
        })
    })
})
```
