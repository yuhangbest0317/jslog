//IE8中没有indexOf方法
if(!Array.prototype.indexOf){
    Array.prototype.indexOf = function(item){
        for(var i = 0;i < this.length; i++){
            if(this[i] === item) return i;
        }
        return -1;
    }
}
//将用户填写的信息保存下来
var queue = window._log || [];
//缓存image对象，防止image对象没有垃圾回收，造成数据发送失败
var images = {};
var features = 'error,console'.split(',');
var info = {};
var encode = window.encodeURIComponent;
//将信息发送服务器
function send(type, data){
    if(features.indexOf(type) === -1) return;
    if(typeof data !== 'string'){
        data = JSON.stringify(data);
    }
    var timestamp = new Date().getTime();
    var date = getUTC0();
    var url = 'http://127.0.0.1:8808/trace?_t=' + timestamp + 
            '&project=' + encode(info.project) + 
            '&user=' + encode(info.user) + 
            '&page=' + encode(info.page) +
            '&type=' + encode(type) +
            '&time=' + encode(date) +
            '&data=' + encode(data);
    var img = new Image();
    images[timestamp] = img;
    img.onload = img.onerror = img.onabort = function(){
        img.onload = img.onerror = img.onabort = null;
        img = null;
        images[timestamp] = null;
    }
    img.src = url;
}
function getUTC0(){
    var date = new Date();
    var localeTime = date.getTime();
    var localeOffset = date.getTimezoneOffset()*60000;
    var utc = localeTime + localeOffset;
    var newDate = new Date(utc);
        return newDate.toLocaleString();
}
var _log = window._log = {
    push: function(params){
        if(Object.prototype.toString.call(params) !== '[object Array]') return;
        var type = params[0];
        if(typeof this[type] !== 'function') return;
        queue.push(params);
        sendData(); 
    },
    enable: function(features){
        features = features.replace(/\s+/g, '').split(',');
    },
    project: function(val){
        if(typeof val === 'function'){
            val = val();
        }
        info.project = val || '';
    },
    user: function(val){
        if(typeof val === 'function'){
            val = val();
        }
        info.user = val || '';
    },
    page: function(val){
        if(typeof val === 'function'){
            val = val();
        }
        info.page = val || window.location.toString();
    }


}
var timeout = null;
function sendData(){
    if(timeout) return;
    var params = queue.shift();
    if(!params) return;
    var type = params.shift();//type=params[0];
    if(typeof _log[type] === 'function'){
        _log[type].apply(_log, params);
    }
    if(['project', 'user', 'page'].indexOf(type) === -1){
        timeout = setTimeout(function(){
            timeout = null;
            sendData();
        }, 1000)
    }else{
        sendData();
    }

}
sendData();

window.onerror = function(){
    _log.push(['error',arguments]);
}
_log.error = function(message, url, line, column, error){
    if(Object.prototype.toString.call(message) === '[object Arguments]'){
        return _log.error.apply(_log, message);
    }
    try{
        var type = Object.prototype.toString.call(message);
        if(type === '[object Error]'){
            error = message;
            message = message.toString();
        }else if(type === '[object Object]'){
            message = JSON.stringify(message);
        }
        //允许开发人员检测到错误时，手动发送一条错误信息
        if(typeof message !== 'string'){
            data = {message: data};
        }
        //获取错误堆栈信息
        var stack = '-';
        if(error && error.stack){
            stack = error.stack;
        }
        var data = {
            message: message,
            url    : url || '',
            line   : line || 0,
            column : column || 0,
            stack  : stack
        };
        send('error', data);
    }catch(e){}
}
    console.oldLog = console.log;
    console.oldError = console.error;
    console.oldWarn = console.warn;
    console.oldInfo = console.info;
    console.oldDebug = console.debug;
    console.log = function(str) {
        console.oldLog(str);
        _log.push(['console', 'log', str]);
    } 
    console.error = function(str) {
        console.oldError(str);
        _log.push(['console', 'error', str]);
    }
    console.warn = function(str){
        console.oldWarn(str);
        _log.push(['console', 'warn', str]);
    }
    console.info = function(str){
        console.oldInfo(str);
        _log.push(['console', 'info', str]);
    }
    console.debug = function(str){
        console.oldDebug(str);
        _log.push(['console', 'debug', str]);
    }    
_log.console = function(type, message){
    var data = {
            type: type,
            message: message
        };
        send('console', data);
}