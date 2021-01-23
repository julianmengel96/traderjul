var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const https = require('https');

const fs = require('fs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: 'dx0BIUwMxO8aPPRozuml7CKlklRnGuPzbUKHCNWYtVljtF3wNgVWJrd40XbxCjq5',
  APISECRET: 'TRvBrM85B2JrggngllrbwhpYQJAuHh9JhpJ5HpXAZ0YnxFwaZH0qld3kW7unfIQB'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
//app.use('/users', usersRouter);

app.get("/", function(req, res) {
   console.log("tes");
   res.render("index", {stats: {
       money : money+ coins*lastPrice,
       current: lastPrice/start,
       tradeArray: tradeArray,
       high: high,
       low: low
   }});
});

app.get("/ping", function(req, res) {
   console.log("tes");
   res.json({});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

let start = null;
let lastPrice;
let money = 100;
let coins = 0;
let tradeSize = 0.05;
let changeSize = 1.011;
let tradingFee = 0.001;
let high = null;
let low = null;
let tradeArray = new Array();

/*
let rawdata = fs.readFileSync('stats.json');
let stats = JSON.parse(rawdata);
console.log(stats);
if(!stats.first) {
    money = stats.money;
    coins = stats.coins;
    
}
*/

function buy(price) {
    if(money>1) {
        if(money*tradeSize>1) {
            coins += (money*tradeSize/price) - (money*tradeSize/price)*tradingFee;
            money -= money*tradeSize;
        }
    }
    let trade = "BUY: "+price+" | " + (money+ coins*price)
    console.log(trade);
    tradeArray.push(trade);
}

function sell(price) {
    if(coins*price>1) {
        if(coins*price*tradeSize>1) {
            money += (coins*tradeSize*price) - (coins*tradeSize*price)*tradingFee;
            coins -= coins*tradeSize;
        }
    }
    let trade = "SELL: "+price+" | " + (money+ coins*price);
    console.log(trade);
    tradeArray.push(trade);
}

binance.websockets.trades('ETHUSDT', (trades) => {
  let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;
  //console.info(symbol+" trade update. price: "+price+", quantity: "+quantity+", maker: "+maker);
  if(start==null){
      start = price;
      low = 1;
      high = 1;
      coins = 100/price;
  }
  //console.log(price/start)
  if(price > start * changeSize) {
      start = price;
      low = 1;
      high = 1;
      sell(price);
  }
  if(price < start / changeSize) {
      start = price;
      low = 1;
      high = 1;
      buy(price);
  }
  lastPrice = price;
  if(lastPrice/start > high) {
      high = lastPrice/start;
  }
  if(lastPrice/start < low) {
      low = lastPrice/start;
  }
});

function pingMe() {
    https.get('https://ruddy-oval-beast.glitch.me/ping', (resp) => {
  let data = '';

  // A chunk of data has been received.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    console.log(JSON.parse(data).explanation);
      setTimeout(pingMe, 60000*3);
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
  
}
setTimeout(pingMe, 60000*3);

module.exports = app;
