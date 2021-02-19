var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')
var multer = require('multer')
const {v4: uuidv4} = require('uuid');
var puppeteer = require('puppeteer')
const fs = require('fs');
var url2pdf = require("url2pdf");
const { send } = require('process');


/*
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
*/

// var upload = multer({ storage: storage })

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'pdfs')));

// MAIN PAGE
app.get('/', (req, res) => {
  const localData = 'localData/';
  var files = []
  fs.readdir(localData, (err, files) => {
    files.forEach(file => {
      files.push(file.path)
      console.log(file.path)
    });
  });
  res.render('index', {files: files});
})

// PREVIEW PAGE
app.get('/gen', (req, res) => {
  if(req.query){
    var ser_num = uuidv4();
    var {bpo, date, inc, prepared, start_time, end_time, desc, impacted, num_of_workstations, root_cause, resl, preven} = req.query
    var fullUrl = req.protocol + '://' + req.get('host');
    var data = {fullUrl:fullUrl, ser_num:ser_num, bpo: bpo, date:date, inc:inc, prepared:prepared, start_time:start_time, end_time:end_time, desc:desc, impacted:impacted, num_of_workstations:num_of_workstations, root_cause:root_cause, resl:resl, preven:preven}
    // convert json to string
    const formatJson = JSON.stringify(data);
    // write JSON string to a file
    fs.writeFile(`localData/${ser_num}.json`, formatJson, (err) => {
      if (err) {
          throw err;
      }
      console.log("JSON data is saved.");
    });

    res.render('gen.ejs', {fullUrl:fullUrl, ser_num:ser_num, bpo: bpo, date:date, inc:inc, prepared:prepared, start_time:start_time, end_time:end_time, desc:desc, impacted:impacted, num_of_workstations:num_of_workstations, root_cause:root_cause, resl:resl, preven:preven})
    
  }else{
    res.redirect("/")
  }
});

app.get("/pdf/:id", async (req, res) => {
  try {
    const pdf_id = req.params.id
  fs.readFile(`localData/${pdf_id}.json`, (err, data) => {
    if(!err){
      let rca = JSON.parse(data);
      res.render("pdf.ejs", {ser_num:rca['ser_num'], bpo: rca['bpo'], date:rca['date'], inc:rca['inc'], prepared:rca['prepared'], start_time:rca['start_time'], end_time:rca['end_time'], desc:rca['desc'], impacted:rca['impacted'], num_of_workstations:rca['num_of_workstations'], root_cause:rca['root_cause'], resl:rca['resl'], preven:rca['preven']})
    }else{
      res.redirect("/")
    }
    });
  } catch (error) {
    console.log(error)
  }
})

app.get("/downloadpdf", async (req, res) => {
  const url = req.query.target;
    url2pdf.renderPdf(url, {
    paperSize: {format: "A4", orientation: 'portrait'}, 
    autoCleanFileAgeInSec: 24 * 3600,
  }).then(function(path){
      //res.contentType("application/pdf");
      res.sendFile(path)
    });
})

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

module.exports = app;
