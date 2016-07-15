var request = require('request');

var calender = {
    1: [31, 17],

    2: [28, 21],

    3: [31, 17],

    4: [30, 16],

    5: [31, 16],

    6: [30, 20],

    7: [31, 18],

    8: [31, 15],

    9: [30, 19],

    10: [31, 17],

    11: [30, 21],
    12: [31, 19],
}

var calenderNameTable = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  June: 6,
  Jul: 7,
  july: 7,
  Aug: 8,
  Sep: 9,
  Sept: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12
}


var daysTillExpiry = function(tradeDate, expiration) {
  console.log('days till expiry invoked')
    var count = 0;
    //the difference between the months of the expiration and the trade date
    // plus how many days left in that month and how days in the month the expiration
    if (expiration.month > tradeDate.month) {

        var differenceInMonths = expiration.month - tradeDate.month - 1;
        var daysInExpiryMonth = calender[expiration.month][1];

        for (var i = expiration.month; i > tradeDate.month; i--) {
            count += 31 - calender[i][0];
        }
        console.log('12341234132')
            // console.log(count)
            // console.log(daysInExpiryMonth +
            //     (differenceInMonths * 31) -
            //     Math.abs(count) +
            //     (calender[tradeDate.month][0] -
            //         calender[tradeDate.month][1]));
        return (daysInExpiryMonth +
            (differenceInMonths * 31) -
            Math.abs(count) +
            (calender[Number(tradeDate.month)][0] -
                calender[Number(tradeDate.month)][1]));

    } else if (expiration.month < tradeDate.month) {
        var differenceInMonths = 12 - tradeDate.month;
        var daysInExpiryMonth = calender[expiration.month][1];

        for (var i = tradeDate.month; i < 12; i++) {
            count += 31 - calender[i][0];
        }

        return (daysInExpiryMonth +
            (differenceInMonths * 31) -
            Math.abs(count) +
            (calender[Number(tradeDate.month)][0] -
                calender[Number(tradeDate.month)][1])
        );


        console.log('error next year');
        return 'error'
    } else if (expiration.month === tradeDate.month) {
        if (expiration.day !== tradeDate.day) {
            console.log(expiration.day - tradeDate.day);
            return (expiration.day - tradeDate.day);
        } else {
            console.log("error")
            return "error"
        }

    }
}

// var endDate = '2014-05-20';
// var startDate = '2014-05-21';

// function retrieveData(inputURL, destinationObject) {
//     var tempData = [];
//     $.getJSON(inputURL, function(data) {
//         $.each(data, function(key, val) {
//             var resultsArray = val.results.quote;
//             for (var i = 0; i < resultsArray.length; i++) {
//                 tempData.push(resultsArray[i].Close);
//             }
//         });
//         // initialDataCheck++;
//         destinationObject.priceData = tempData;
//         // destinationObject.adjustedPriceData = returnsAsPercentage(destinationObject.priceData);
//         // if(initialDataCheck >= staticSymbol.length){
//         //   $('#getData').removeClass('hider');
//         // }

//     });

// }


// function detectSymbol(object,symbol,startDate,endDate) {
//   if(object[symbol] == undefined)
//     {
//     object[symbol] = {};
//     object[symbol].URL = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22'+symbol+'%22%20and%20startDate%20%3D%20%22'+'2014-05-21'+'%22%20and%20endDate%20%3D%20%22'+'2014-05-20'+'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=';
//     retrieveData(object[symbol].URL,object[symbol]);
//     }
// }

// detectSymbol(object)
// var symbol = 'ddd';


// var days = daysTillExpiry(tradeObject, { month: expirationMonth, day: expirationDay });



var stockPriceInfo = function(stock, date, expiration, premium, id) {
  console.log('stock price invoked')
  return new Promise(function(resolve,reject) {
    console.log('in the new promise');
    var formattedMonth = calenderNameTable[expiration]
    console.log(formattedMonth)
    var expirationMonth = formattedMonth;
    console.log(expirationMonth)
    var expirationDay = calender[expirationMonth][1];
    console.log(expirationDay)
    
    var expirationObject = {
        month: expirationMonth,
        day: expirationDay
    }
    console.log(date)
    var startDate = "20" + date.year + "-" + date.month + "-" + date.day;
    var endDate = "20" + date.year + "-" + date.month + "-" + (Number(date.day));
    console.log(startDate, " ",endDate)
    var info = {}
    var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22"+stock+"%22%20and%20startDate%20%3D%20%22" + startDate + "%22%20and%20endDate%20%3D%20%22" + endDate + "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback="

    var rateCalc = function(vwap, time, premium) {
        return premium / (time / 365) / vwap
    };



    request.get(url, function(error, response, body) {
      console.log('return from get request')
      if(error) {
        console.log('error')
        reject(info);
      } else{
        console.log('req success')
        console.log(JSON.parse(response.body).query.results.quote)
        info.closingPrice = JSON.parse(response.body).query.results.quote.Close;
        info.duration = daysTillExpiry(date, expirationObject);
        info.rate = rateCalc(info.closingPrice, info.duration, premium);
        info.identity = id;
        console.log('responsed back with info')
        resolve(info);
      }
    });
  });
};



// console.log(output(52,days,1.55));

module.exports = {
    stockPriceInfo: stockPriceInfo
}
