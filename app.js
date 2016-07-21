var express = require('express');
var partials = require('express-partials');
var readline = require('readline');
var data = require("./database/db.js");
var calender = require("./helpers/calender.js");
var bodyParser = require('body-parser');
var Imap = require('imap');
var app = require('./config/routes.js');
var MailParser = require('mailparser');
var mailparser = new MailParser.MailParser();

//import from db.js, do not upload data to git
// require("./controller.js").inputTrades(data);
// var dataInit = require("./controller.js");

var updateDB = function(emailBody, database) {
    var tradeStringArray = [];
    var tradeSorted = [];
    var currentStart = 0;
    for (var i = 0; i < emailBody.length; i++) {
        if (emailBody[i] === "x") {
            tradeStringArray.push(emailBody.slice(currentStart, i));
            currentStart = i + 1;
        }
    }
    // console.log(tradeStringArray);

    for (var i = 0; i < tradeStringArray.length; i++) {
        var currentStart = 0;
        var tempArray = [];
        for (var j = 0; j <= tradeStringArray[i].length; j++) {
            if (tradeStringArray[i][j] === " " || j === tradeStringArray[i].length) {
                tempArray.push(tradeStringArray[i].slice(currentStart, j));
                currentStart = j + 1;
            }
        }
        tradeSorted.push(tempArray);
    }
    // console.log(tradeSorted);
    var currentID = 593;
    var uploadDBTrades = [];
    //  [ 'SMH', 'Jul', '60', 'r/c', 'traded', '.04', 'inv' ]
    //{ "Date": "04/24/14", "Symbol": "SPY", "Expiration": "Jun", "Strike": 200, "Price": 0.83, "Type": "inv", "Size": 10000, "ID": 1 }
    for (var i = 0; i < tradeSorted.length; i++) {
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
    // console.log(uploadDBTrades);
};
// setup an event listener when the parsing finishes
mailparser.on("end", function(mail_object) {
    console.log("mail event invoked because mail_object exists: ", Object.keys(mail_object));
    // console.log("From:", mail_object.from); //[{address:'sender@example.com',name:'Sender Name'}]
    // console.log("Subject:", mail_object.subject); // Hello world!
    // console.log("Text body:", mail_object.text); // How are you today?
    // updateDB(mail_object.text);

});

// send the email source to the parser


var config = require('./config/config.js');

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
                // console.log('Message #%d', seqno);
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
        console.log(1, err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
    });

    imap.connect();
}

app.listen(app.get('port'), function() {
    console.log('App Listening on port 3000');
});


