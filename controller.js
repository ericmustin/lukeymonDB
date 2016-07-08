var Trades = require("./database/model.js");

module.exports = {
    retrieveTrades: function(res) {
        var trades = Trades.find({}).exec(function(err, found) {
            if (err) {
                console.log('controller error');
                return [];
            } else {
                console.log(found)
                console.log('db returned a ', typeof found);
                var symbolList = [];
                for (var i = 0; i < found.length; i++) {
                    if (symbolList.indexOf(found[i]['symbol']) === -1) {
                        symbolList.push(found[i]['symbol']);
                    }
                }
                res.send({ data: symbolList });
            }
        });

    },
    inputTrades: function(dataArray) {
        var errorCounter = 0;
        var successCounter = 0;
        for (var i = 0; i < dataArray.length; i++) {
            var trade = new Trades({
                day: dataArray[i]['Date'],
                symbol: dataArray[i]['Symbol'],
                expiration: dataArray[i]['Expiration'],
                strike: dataArray[i]['Strike'],
                price: dataArray[i]['Price'],
                type: dataArray[i]['Type'],
                size: dataArray[i]['Size'],
                id: dataArray[i]['ID']
            });

            trade.save(function(err, success) {
                if (err) {
                    errorCounter++;
                    console.log('controller error');
                } else {
                    successCounter++;
                    console.log('successful save to db')
                }
            });
        }
        console.log('data save complete, errors ', errorCounter, ' successes', successCounter);
    }
};
