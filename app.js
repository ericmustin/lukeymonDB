var readline = require('readline');
var data = //import from db.js, do not upload data to git



//CLI interface setup
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var symbolLookUp = function(symbol, data) {
    var tempData = {};
    tempData.symbol = symbol || null;
    tempData.match = false;
    tempData.results = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i]['Symbol'] === symbol.toUpperCase()) {
            tempData.results.push(data[i]);
        }
    }
    if (tempData.results.length === 0) {
        return tempData;
    } else {
        tempData.match = true;
        tempData.symbol = symbol;
        return tempData;
    }
};

var displayData = function(resultObject) {
    var tradeDate, expiration, strike, price, type, size;
    var timestamp = 0;
    var matchingTrades = [];
    var symbol = resultObject.symbol || 'Not Found';

    if (!resultObject.match) {
        return 'No Match, Please try again';
    } else {
        for (var i = 0; i < resultObject.results.length; i++) {
            if (resultObject.results[i]['ID'] > timestamp) {
                timestamp = resultObject.results[i]['ID'];
                tradeDate = resultObject.results[i]['Date'];
                strike = resultObject.results[i]['Strike'];
                price = resultObject.results[i]['Price'];
                type = resultObject.results[i]['Type'];
                size = resultObject.results[i]['Size'];
                expiration = resultObject.results[i]['Expiration'];
            }
        }
    }
    matchingTrades = resultObject.results.filter(function(trade) {
        return trade['Strike'] === strike && trade['Expiration'] === expiration;
    });
    return matchingTrades;

};

var init = function() {
    rl.on('line', function(userInput) {
        var displayText;
        if (userInput === 'quit') {
            console.log('goodbye!');
            rl.close();
        } else {
            displayText = displayData(symbolLookUp(userInput, data));
            if (typeof displayText === 'String') {
                console.log(displayText);
            } else if (Array.isArray(displayText)) {
                displayText.forEach(function(trade) {
                    var tempString = '';
                    for (x in trade) {
                        tempString = tempString + ' ' + x + ':' + ' ' + trade[x];
                    }
                    console.log(tempString);
                });
                var topTrade = displayText[displayText.length-1];
                var totalSize = displayText.reduce(function(a,b){
                  return a + b['Size'];
                },0);
                console.log('Most Recent Trade in is \n');

                for(var y in topTrade) {
                    console.log(y,': ',topTrade[y]);
                }
                console.log('total size traded on this line: ', totalSize);
                var avgPx = 0;
                displayText.forEach(function(trade) {
                    avgPx += trade['Price'] * (trade['Size']/totalSize)
                });
                console.log('avg price on this line: ', avgPx);


            } else {
                console.log('Error, please try again');
            }
        }
        //reprompts the user after the library logic function has completed
        rl.prompt();
    });

    //callback invoked by a quit command
    rl.on('close', function() {
        console.log('Bye!');
        process.exit(0);
    });

    //welcome and prompt user
    console.log("Welcome to LukeymonDB");
    rl.setPrompt('Enter Symbol>');
    rl.prompt();
};

//init
init();
