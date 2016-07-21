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
  jul: 7,
  July: 7,
  july: 7,
  Aug: 8,
  Aaug: 8,
  Sep: 9,
  Sept: 9,
  Oct: 10,
  Nov: 11,
  nov: 11,
  Dec: 12
}

var daysTillExpiry = function(tradeDate, expiration) {
  console.log('days till expiry invoked')
  console.log('trade date is ', tradeDate)
  console.log('expiration date is ', expiration)
  var tradeDateMonthConverted = Number(tradeDate.month);
  var count = 0;
  //the difference between the months of the expiration and the trade date
  // plus how many days left in that month and how days in the month the expiration
  if (expiration.month > tradeDateMonthConverted) {

    var differenceInMonths = expiration.month - tradeDateMonthConverted - 1;
    var daysInExpiryMonth = calender[expiration.month][1];

    for (var i = expiration.month; i > tradeDateMonthConverted; i--) {
      count += 31 - calender[i][0];
    }
    console.log('expiration.month > tradeDateMonthConverted');
    return (daysInExpiryMonth +
      (differenceInMonths * 31) -
      Math.abs(count) +
      (calender[tradeDateMonthConverted][0] -
        calender[tradeDateMonthConverted][1]));

  } else if (expiration.month < tradeDateMonthConverted) {
    var differenceInMonths = 12 - tradeDateMonthConverted;
    var daysInExpiryMonth = calender[expiration.month][1];

    for (var i = tradeDateMonthConverted; i < 12; i++) {
      count += 31 - calender[i][0];
    }
    console.log('error expiry month < trade date month')
    return (daysInExpiryMonth +
      (differenceInMonths * 31) -
      Math.abs(count) +
      (calender[tradeDateMonthConverted][0] -
        calender[tradeDateMonthConverted][1])
    );




  } else if (expiration.month === tradeDateMonthConverted) {
    if (expiration.day !== tradeDate.day) {
      console.log(expiration.day - tradeDate.day);
      console.log('error x');
      console.log(expiration.day);
      console.log(tradeDate.day);
      console.log(expiration.day - tradeDate.day)
      return (expiration.day - tradeDate.day);
    } else {
      console.log("error look here: ",expiration.day, " ", tradeDate)
      return 1
    }

  }
}

var rateCalc = function(vwap, time, premium) {
  return premium / (time / 365) / vwap *100
};

var stockPriceInfo = function(stock, date, expiration, premium, id) {

  return new Promise(function(resolve, reject) {
    var info = {};
    var formattedMonth = calenderNameTable[expiration];
    var expirationMonth = formattedMonth;
    console.log("hey look here: ",expiration)
    console.log(formattedMonth)
    console.log(expirationMonth)
    console.log(expiration,stock,date,id)
    var expirationDay = calender[expirationMonth][1];

    var expirationObject = {
      month: expirationMonth,
      day: expirationDay
    };

    var startDate = "20" + date.year + "-" + date.month + "-" + date.day;
    var endDate = startDate;

    var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22" + stock + "%22%20and%20startDate%20%3D%20%22" + startDate + "%22%20and%20endDate%20%3D%20%22" + endDate + "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback="

    request.get(url, function(error, response, body) {
      // return new Promise(function(resolve,reject){
      console.log('return from get request')
      if (error) {
        console.log('error')
        console.log(startDate, " ", endDate)
        reject(info);
      } else {
        // console.log('req success')
        // console.log(typeof JSON.parse(response.body).query.results)
        // console.log(typeof JSON.parse(response.body).query)
        if (JSON.parse(response.body).query === undefined) {
          console.log("response is: ", JSON.parse(response.body));
          console.log('error xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
          // console.log(startDate, " ", endDate)
          // console.log('response body is: ', JSON.parse(response.body));
          // console.log('response body query is: ', JSON.parse(response.body).query);
          // console.log('response body query results is: ', JSON.parse(response.body).query.results);
          console.log('should reject after');
          
          console.log('i dont think this should log?');
          info.closingPrice = 0;
          info.rate = 0;
          info.identity = id;
          resolve(info);
          return;
          
        }
        console.log(JSON.parse(response.body).query.results);
        console.log(typeof JSON.parse(response.body).query);
        console.log(typeof JSON.parse(response.body).query.results.quote);
        info.closingPrice = JSON.parse(response.body).query.results.quote.Close;
        info.duration = daysTillExpiry(date, expirationObject);
        console.log('shuold invoked between daysTillExpiry and rateCalc')
        info.rate = rateCalc(info.closingPrice, info.duration, premium);
        info.identity = id;
        console.log('responsed back with info')
        console.log("info is: ", info)
        resolve(info);
      }

    });
  });
};

module.exports = {
  stockPriceInfo: stockPriceInfo
}
