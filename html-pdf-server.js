// service to create PDF files from a given URL

var express = require('express');
var app = express();

// define the public directory for static assets
var public_dir = __dirname + '/public';

// setup express
app.use(express.compress());
app.use(express.static(public_dir));
app.use(express.json());
app.use(express.urlencoded());

// setup jade
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

// route: get: /
app.get('/', function (req, res) {
  res.render('index',
    { title : 'NodeJS PhantomJS HTML to PDF' }
  )
});

// route: post: /process_url
app.post('/process_url', function (req, res) {

  // get url to process
  var url_to_process = req.body.url;
  if (url_to_process === undefined || url_to_process == '') {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end("404 Not Found");
  }

// phantomjs PDF creation
  
console.log('Loading a web page');

var phantom = require("phantom");
var _ph, _page, _outObj;

phantom.create().then(ph => {
    _ph = ph;
    return _ph.createPage();
}).then(page => {
    _page = page;
    // format page 
    _page.paperSize = {
      format: "A4",
      orientation: "portrait",
      margin: {left:"2.5cm", right:"2.5cm", top:"1cm", bottom:"1cm"},
      footer: {
        height: "0.9cm",
        contents: _ph.callback(function(pageNum, numPages) {
          return "<div style='text-align:center;'><small>" + pageNum +
            " / " + numPages + "</small></div>";
        })
      }
    };
    _page.zoomFactor = 1.5;
    return _page.open(url_to_process);
}).then(status => {

    console.log(status);
     
    if (status == "success") {
        // put PDF in public directory
        var pdf_file_name = url_to_process.replace(/\W/g, '_') + ".pdf"
        var pdf_path = public_dir + "/" + pdf_file_name
        console.log('created ' + pdf_path);
        _page.render(pdf_path).then(function() {
          // Download PDF
          res.setHeader('Content-disposition', 'attachment; filename=' + pdf_file_name);
          res.setHeader('Content-type', 'application/pdf');
          res.download(pdf_path);

          _page.close();
          _ph.exit();
        });      
      }
      else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("404 Not Found");
         _page.close();
        _ph.exit();
      }
  }).catch(e => console.log(e));
});


// start server
var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});

