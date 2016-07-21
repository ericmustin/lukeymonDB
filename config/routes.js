var express = require('express');
var partials = require('express-partials');
var data = require("../database/dbMigrationA.js");
var calender = require("../helpers/calender.js");
var bodyParser = require('body-parser');
var inspect = require('util').inspect;
var app = express();






app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(__dirname + '/../public'));

app.set('port', (process.env.PORT || 3000));


  var getTradeSymbols = function() {
    var symbolList = [];
    for (var i = 0; i < data.length; i++) {
      if (symbolList.indexOf(data[i]['Symbol']) === -1) {
        symbolList.push(data[i]['Symbol']);
      }
    }
    return symbolList
  };

app.get('/input', function(req, res) {
  console.log('input');


  var symbolList = getTradeSymbols();
  res.send({ data: symbolList });
});


app.post('/api', function(req, res) {


  var userInput = req.body.symbol;
  var displayObject = {};
  var responseObject = {};
  responseObject.output = [];
  responseObject.outputDates = [];
  responseObject.outputPrices = [];
  responseObject.outputIds = [];
  responseObject.outputStrings = [];
  responseObject.outputAllTrades = [];
  responseObject.outputAllDates = [];
  responseObject.outputAllPrices = [];
  responseObject.outputAllIds = [];
  responseObject.outputAllStrings = [];
  responseObject.outputAllRates = [];

  var validSymbolArray = getTradeSymbols();
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
    var tradeDate, expiration, strike, price, type, size, stockPriceInfo;
    var timestamp = 0;
    var matchingTrades = [];
    var symbol = resultObject.symbol || 'Not Found';

    // calender.stockPriceInfo()
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
    resultObject.matchingTrades = resultObject.results.filter(function(trade) {
      return trade['Strike'] === strike && trade['Expiration'] === expiration;
    });

    return resultObject;

  };

  if (typeof userInput !== 'string' || validSymbolArray.indexOf(userInput) === -1) {

    console.log('fail');
    res.send(200, JSON.stringify({ "error": true }));
    return;
  } else {
    displayObject = displayData(symbolLookUp(userInput, data));

    if (typeof displayObject.matchingTrades === 'string') {
      // console.log(displayObject.matchingTrades);
      res.send(200, { "error": true });
    } else if (Array.isArray(displayObject.matchingTrades)) {
      // console.log(displayObject.matchingTrades);
      responseObject.topTrade = displayObject.matchingTrades[displayObject.matchingTrades.length - 1];
      responseObject.totalSize = displayObject.matchingTrades.reduce(function(a, b) {
        return a + b['Size'];
      }, 0);

      responseObject.avgPx = 0;
      displayObject.matchingTrades.forEach(function(trade) {
        if (trade['Type'] === 'inv') {
          responseObject.avgPx += trade['Price'] * -1 * (trade['Size'] / responseObject.totalSize)
        } else {
          responseObject.avgPx += trade['Price'] * (trade['Size'] / responseObject.totalSize)
        }
      });

      displayObject.matchingTrades.forEach(function(trade) {
        responseObject.output.push(trade);
        var tempString = '';
        for (x in trade) {
          if (x === 'Date') {
            responseObject.outputDates.push(Date(trade[x]));
          }
          if (x === 'Price') {
            if (trade['Type'] === 'inv') {
              responseObject.outputPrices.push(trade[x] * -1);
            } else {
              responseObject.outputPrices.push(trade[x]);
            }
          }
          if (x === 'ID') {
            responseObject.outputIds.push(trade[x]);
          }
          tempString = tempString + ' ' + x + ':' + ' ' + trade[x];

        }
        responseObject.outputStrings.push(tempString);
      });
      var promiseArray = [];
      displayObject.results.forEach(function(trade) {
        console.log('making promise')

        var promise = new Promise(function(resolve, reject) {


          var tempString = '';
          for (x in trade) {
            if (x === 'Date') {
              responseObject.outputAllDates.push(Date(trade[x]));
            }
            if (x === 'Price') {
              if (trade['Type'] === 'inv') {
                responseObject.outputAllPrices.push(trade[x] * -1);
              } else {
                responseObject.outputAllPrices.push(trade[x]);
              }
            }
            if (x === 'ID') {
              responseObject.outputAllIds.push(trade[x]);
            }

            tempString = tempString + ' ' + x + ':' + ' ' + trade[x];

          }
          responseObject.outputAllStrings.push(tempString);

          responseObject.outputAllTrades.push(trade);

          var dateObject = {};
          dateObject.month = trade["Date"].slice(0, 2);
          dateObject.day = Number(trade["Date"].slice(3, 5));
          dateObject.year = Number(trade["Date"].slice(6, 8));
          var tempAnswer = calender.stockPriceInfo(trade['Symbol'], dateObject, trade["Expiration"], Number(trade["Price"]), trade["ID"]);


          resolve(tempAnswer);
          reject(tempAnswer);
        })

        promiseArray.push(promise);

      });


      Promise.all(promiseArray).then(function(x) {
        console.log('promises returned', x)
        for (var i = 0; i < x.length; i++) {
          responseObject.outputAllTrades.forEach(function(currentTrades) {
            // console.log('check');
            if (x[i].identity === currentTrades["ID"]) {
              console.log('match');
              currentTrades.stockPriceInfo = x[i];
            }
          });

        }
        responseObject.outputAllTrades.forEach(function(currentTrades) {
          responseObject.outputAllRates.push(currentTrades.stockPriceInfo.rate);
        });
        console.log('successful response')
        res.send(200, JSON.stringify(responseObject));

      }).catch(function(error) {
        console.log('catch invoked for: ', error);
        res.send(200, JSON.stringify({ "error": true }));
      });

    } else {
      console.log('Error, please try again');
      res.send(200, JSON.stringify({ "error": true }));
    }
  }
});

module.exports = app;
