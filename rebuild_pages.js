'use strict';

var through = require('through2'),
    fs = require('fs');

module.exports = function(search, replacement, options){
  var doRebuild = function(file, enc, callback) {
    var dataDir = __dirname.split('node_modules')[0] + 'src/templates/pages',
        curFileName = '';
    if (file.isNull()) {
      return callback(null, file);
    }

    function setFileVars(str){
      if(String(file.contents).split('\n')[0] == '//---'){
        var fileVarsArr = String(file.contents).split(/\n\s{0,}\n/g)[0].split('//---')[1].split('\n');
        var fileVars = {};
        console.log('fileVarsArr=', fileVarsArr)
        // for (var i = 1; i < fileVarsArr.length; i++){
        //   if(fileVarsArr[i].split(':')[0].replace(/\s{0,}/g, '') == 'modals'){
        //     modalsList = fileVarsArr[i].split(':')[1].replace(/\s{0,}$/g, '').replace(/^\s{0,}/g, '').split(',')
        //   }else{
        //     fileVars[fileVarsArr[i].split(':')[0].replace(/\s{0,}/g, '')] = fileVarsArr[i].split(':')[1].replace(/\s{0,}$/g, '').replace(/^\s{0,}/g, '')
        //   }
        // };
        // jadeVars = '- file = ' + JSON.stringify(fileVars) + '\n';
        // parentTplName = fileVarsArr[1].split(':')[1].replace(/\s{0,}/g, '');

        // console.log('parentTplName=', parentTplName)
      }
    }

    function rFiles(filesList, num){ //read Json file data
      if(num < filesList.length - 1){
        fs.readFile(dataDir + '/' + filesList[num], 'utf8', function (err, data) {
          // var fileVarsArr = data.split(/\n\s{0,}\n/g)[0]
          // console.log('fileVarsArr=', fileVarsArr)
          console.log('data=', filesList[num], data.length)
          // fs.writeFile(dataDir + '/' + filesList[num], data, function (err) {
          //   rFiles(filesList, num  + 1);
          // })
          // 
          rFiles(filesList, num  + 1);
        });
      }
    }

    function rDir(err, filesList){ //read Json data dir
      rFiles(filesList, 0)
    }

    function doRebuild() {
      
      if (file.isBuffer()) {
        // var chunks = String(file.contents).split('');
        curFileName = file.history[0].split('/')[file.history[0].split('/').length - 1].split('.')[0]
        // console.log('curFileName=', curFileName)
        // console.log('setFileVars=', setFileVars)
        fs.readdir(dataDir, rDir)
        return callback(null, file);
      }

      // callback(null, file);
    }

    doRebuild();
  };

  return through.obj(doRebuild);
};
