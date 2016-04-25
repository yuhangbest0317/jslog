var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://127.0.0.1:27017/tasks');
var Schema = mongoose.Schema;

var Logs = new Schema({
    project:   String,
    user:      String,
    url:       String,
    userAgent: String,
    level:     String,
    message:   String,
    time:      String
});
var Errors = new Schema({
    project:   String,
    user:      String,
    url:       String,
    userAgent: String,
    line:      String,
    column:    String,
    message:   String,
    stack:     String,
    time:      String
});
var Error = mongoose.model('Error', Errors);
var Log = mongoose.model('Log', Logs);

function saveError(req, res){
    var error = new Error();
    var params = req.query;
    error.project = params.project;
    error.user = params.user;
    error.url = params.page;
    error.userAgent = req.headers['user-agent'];
    var data = JSON.parse(params.data);
    error.message = data.message;
    error.line = data.line;
    error.column = data.column;
    error.stack = data.stack;
    error.time = params.time;
    error.save(function(err){
        if(err){
            console.log('err:' + err);
            res.send('error');
            return;
        }
        res.send('ok');
        console.log(data);
        console.log('error save');
    });
}

function saveLog(req, res){
    var log = new Log();
    var params = req.query;
    log.project = params.project;
    log.user = params.user;
    log.url = params.page;
    log.userAgent = req.headers['user-agent'];
    var data = JSON.parse(params.data);
    log.level = data.type;
    log.message = data.message;
    log.time = params.time;
    log.save(function(err){
        if(err){
            console.log('err:' + err);
            res.send('error'); 
            return;
        }
        res.send('ok');
        console.log('log save');
    });

}
function searchLog(callback){
    var Log = mongoose.model('Log');
    Log.find({},function(err, logs){
        if(err){
            console.log('err:' + err);
        }
        callback(logs);
    })
}
function searchError(callback){
    var Error = mongoose.model('Error');
    Error.find(function(err, errors){
        if(err){
            console.log('err:' + err);
        }
        callback(errors);
    })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express1122' });
});
router.get('/aboutLog', function(req, res, next) {
    searchLog(function(logs){
        res.render('aboutLog',{logs: logs});
    });
    
});
router.get('/aboutError', function(req, res, next) {
    searchError(function(errors){
        res.render('aboutError',{errors: errors});
    });
});
router.get('/trace', function(req, res, next) {
    var params = req.query;
    if(params.type === 'error'){
        saveError(req, res);
    }else if(params.type === 'console'){
        saveLog(req, res);
    }
});

module.exports = router;
