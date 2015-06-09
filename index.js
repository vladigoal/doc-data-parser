'use strict';

var through = require('through2'),
    fs = require('fs');

module.exports = function() {
  var doReplace = function(file, enc, callback) {
    var jadeVars = '';
    var dataDir = __dirname.split('node_modules')[0] + 'src/templates/data';
    
    if (file.isNull()){
      return callback(null, file);
    }

    function rFile(filesList, num){ //read file data
      if(num < filesList.length - 1){
        fs.readFile(dataDir + '/' + filesList[num], 'utf8', function (err, data) {
          // if (err) throw err;
          data = data.replace(/\r?\n|\r/g, '');
          jadeVars += '  - ' + filesList[num].split('.')[0] + ' = ' + data + '\n';
          rFile(filesList, num  + 1);
        });
      }else{
        var _chunks = String(file.contents).split(/extends/g);
        _chunks = _chunks[1].split(/\n/g);
        file.contents = new Buffer('extends' + _chunks[0] + '\n\n' + jadeVars + '\n' + _chunks.slice(1).join('\n'), 'utf-8');  
        
        // file.contents = new Buffer(file.contents);
        return callback(null, file);
      }
    }

    function rDir(err, filesList){ //read data dir
      rFile(filesList, 0)
    }

    function setFileVars(str){
      if(String(file.contents).split('\n')[0] == '//---'){
        var fileVarsArr = String(file.contents).split(/\n\s{0,}\n/g)[0].split('//---')[1].split('\n');
        var fileVars = {};
        for (var i = 1; i < fileVarsArr.length; i++){
          fileVars[fileVarsArr[i].split(':')[0].replace(/\s{0,}/g, '')] = fileVarsArr[i].split(':')[1].replace(/\s{0,}/g, '')
        };
        jadeVars = 'block generated_params\n  - file = ' + JSON.stringify(fileVars) + '\n';
      }
    }

    function doReplace() {

      if (file.isBuffer()) {
        setFileVars()
        return fs.readdir(dataDir, rDir)
      }

      callback(null, file);
    }

    doReplace();
  };

  return through.obj(doReplace);
};
