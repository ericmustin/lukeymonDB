var readline = require('readline');
var data = require("./db.js"); //import from db.js, do not upload data to git
// require("./controller.js").inputTrades(data);
var dataInit = require("./controller.js");

var express = require('express');
var bodyParser = require('body-parser');
var Imap = require('imap');
var MailParser = require('mailparser');
var mailparser = new MailParser.MailParser();



var updateDB = function(emailBody,database) {
    var tradeStringArray = [];
    var tradeSorted = [];
    var currentStart = 0;
    for(var i =0; i < emailBody.length; i++) {
        if(emailBody[i] === "x") {
            tradeStringArray.push(emailBody.slice(currentStart,i));
            currentStart = i+1;
        }
    }
    console.log(tradeStringArray);

    for(var i =0; i < tradeStringArray.length; i++) {
        var currentStart = 0;
        var tempArray = [];
        for(var j = 0; j <= tradeStringArray[i].length; j++) {
            if(tradeStringArray[i][j] === " " || j === tradeStringArray[i].length) {
                tempArray.push(tradeStringArray[i].slice(currentStart,j));
                currentStart = j+1;
            }
        }
        tradeSorted.push(tempArray);
    }
    console.log(tradeSorted);
    var currentID = 593;
    var uploadDBTrades = [];
    //  [ 'SMH', 'Jul', '60', 'r/c', 'traded', '.04', 'inv' ]
//{ "Date": "04/24/14", "Symbol": "SPY", "Expiration": "Jun", "Strike": 200, "Price": 0.83, "Type": "inv", "Size": 10000, "ID": 1 }
    for(var i = 0; i < tradeSorted.length; i++) {
        var tempObject = {};
        tempObject['Date'] = "04/25/14";
        tempObject.Symbol = tradeSorted[i][0];
        tempObject.Expiration = tradeSorted[i][1];
        tempObject.Strike = Number.parseInt(tradeSorted[i][2]);
        tempObject.Price = Number.parseFloat(tradeSorted[i][5]);
        tempObject.Type = tradeSorted[i][6];
        tempObject.Size = Number.parseInt(tradeSorted[i][7]);
        currentID++;
        tempObject.ID = currentID;
        uploadDBTrades.push(tempObject);
        data.push(tempObject)
    }
    console.log(uploadDBTrades);
};
// setup an event listener when the parsing finishes
mailparser.on("end", function(mail_object) {
    console.log("mail event invoked because mail_object exists: ", Object.keys(mail_object));
    // console.log("From:", mail_object.from); //[{address:'sender@example.com',name:'Sender Name'}]
    // console.log("Subject:", mail_object.subject); // Hello world!
    // console.log("Text body:", mail_object.text); // How are you today?
    updateDB(mail_object.text);

});

// send the email source to the parser

var inspect = require('util').inspect;

var app = express();
var config = require('./config.js');

//check if config file is found locally, not included in repo
if (config.emailPassword) {
    var imap = new Imap({
        user: 'lukeymonDB@yahoo.com',
        password: config.emailPassword, //import from config.js, do not upload pw to git
        host: 'imap.mail.yahoo.com',
        port: 993,
        tls: true,
        secure: true
    });



    function openInbox(cb) {
        imap.openBox('INBOX', true, cb);
    }
    var buffer;

    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) {
                console.log('asfdasdfasdfa')
                return;
            }
            var f = imap.seq.fetch('1', {
                bodies: '',
                struct: true
            });
            f.on('message', function(msg, seqno) {
                console.log('Message #%d', seqno);
                var prefix = '(#' + seqno + ') ';
                msg.on('body', function(stream, info) {
                    buffer = '';
                    stream.on('data', function(chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.once('end', function() {
                        // console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                    });


                });
            });

            f.once('end', function() {
                console.log('Done fetching all messages!');
                mailparser.write(buffer);
                mailparser.end();
                imap.end();
            });
        });
    });

    imap.once('error', function(err) {
        console.log(1,err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
    });

    imap.connect();
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(3000, function() {
    console.log('App Listening on port 3000');
});

app.use(express.static('./index.html'));
app.get('/input', function(req, res) {
    dataInit.retrieveTrades(res);
    // var symbolList = [];
    // for (var i = 0; i < dataInit.length; i++) {
    //     if (symbolList.indexOf(dataInit[i]['symbol']) === -1) {
    //         symbolList.push(dataInit[i]['symbol']);
    //     }
    // }
    // res.send({ data: symbolList });
});

app.post('/api', function(req, res) {
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

    console.log(req.body.symbol)

    var userInput = req.body.symbol;
    var displayText;
    var responseObject = {};
    responseObject.output = [];
    responseObject.outputDates = [];
    responseObject.outputPrices = [];
    responseObject.outputIds = [];
    responseObject.outputStrings = [];


    console.log(typeof userInput);

    if (typeof userInput !== 'string') {
        console.log('fail');
        res.send(200, { "error": true });
    } else {
        displayText = displayData(symbolLookUp(userInput, data));
        if (typeof displayText === 'String') {
            console.log(displayText);
            res.send(200, { "error": true });
        } else if (Array.isArray(displayText)) {
            console.log(displayText);
            displayText.forEach(function(trade) {
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
            responseObject.topTrade = displayText[displayText.length - 1];
            responseObject.totalSize = displayText.reduce(function(a, b) {
                return a + b['Size'];
            }, 0);

            responseObject.avgPx = 0;
            displayText.forEach(function(trade) {
                if (trade['Type'] === 'inv') {
                    responseObject.avgPx += trade['Price'] * -1 * (trade['Size'] / responseObject.totalSize)
                } else {
                    responseObject.avgPx += trade['Price'] * (trade['Size'] / responseObject.totalSize)
                }
            });
            console.log('avg price on this line: ', responseObject.avgPx);


        } else {
            console.log('Error, please try again');
            res.send(200, { "error": true });
        }
    }

    console.log(responseObject);

    res.send(200, JSON.stringify(responseObject));
});
