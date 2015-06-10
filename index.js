'use strict';

var through = require('through2'),
    fs = require('fs');

module.exports = function() {
  var doReplace = function(file, enc, callback) {
    var jadeVars = '';
    var dataDir = __dirname.split('node_modules')[0] + 'src/templates/data';
    var parentTplName = '';
    
    if (file.isNull()){
      return callback(null, file);
    }

    function mixin(blockName, blockSpaces){
      var filePath = __dirname.split('node_modules')[0] + 'src/templates/blocks/' + blockName + '/' + blockName + '.jade';
      var blockContent = '';
      var chunks = fs.readFileSync(filePath, 'utf-8').split('\n');
      for (var i = 0; i < chunks.length; i++){
        blockContent += blockSpaces + '    ' + chunks[i] + '\n';
      }

      return  '  mixin dinamicMixin(data1, data2, data3)\n' +
              blockSpaces + '    - data = {}\n' +
              blockSpaces + '    - redefines = []\n' +
              blockSpaces + '    - if (typeof data1 === "object") redefines.push(data1)\n' +
              blockSpaces + '    - if (typeof data2 === "object") redefines.push(data2)\n' +
              blockSpaces + '    - if (typeof data3 === "object") redefines.push(data3)\n' +
              // blockSpaces + '    - da = JSON.stringify(data1)\n' +
              // blockSpaces + '    p #{da}\n' +
              blockSpaces + '    - for (var i in redefines)\n' +
              blockSpaces + '      - for (var k in redefines[i])\n' +
              blockSpaces + '        - if (redefines[i].hasOwnProperty(k))\n' +
              blockSpaces + '          - data[k] = redefines[i][k]\n' +
              blockSpaces + '    - data._bemto_chain = bemto_chain.slice()\n' +
              blockSpaces + '    - blockName = bemto_chain[bemto_chain.length-1]\n' +
              blockContent +
              // blockSpaces + '    include ../../templates/blocks/' + blockName + '/' + blockName + '.jade\n' +
              // 
              blockSpaces + '  +dinamicMixin'
    }


    function bemReplace(fileContents){
      var chunks = fileContents.split(': +i');
      var result = '';
      if(chunks.length > 1){
        result = '';
        for (var i = 0; i < chunks.length; i++){
          if(i < chunks.length - 1){
              var block = chunks[i].split('\n')[chunks[i].split('\n').length - 1]
              var blockSpaces = block.split('+b')[0]
              if(block.split('.')[1].split('(').length > 1){
                var blockName = block.split('.')[1].split('(')[0]
              }else{
                var blockName = block.split('.')[1]
              }
              result += chunks[i] + '\n' + blockSpaces + mixin(blockName, blockSpaces);
          }else{
              result += chunks[i];
          }
        }
        bemReplace(result);
      }else{
        result = fileContents;
        // console.log('result=', result)
        result = jadeVars + result;
        file.contents = new Buffer(result);
        return callback(null, file);
      }
    }

    function parseParentTpl(){
        if(parentTplName){
          var filePath = __dirname.split('node_modules')[0] + 'src/templates/' + parentTplName + '.jade';
          fs.readFile(filePath, 'utf-8', function (err, parentTplData) {
            var fileContents = String(file.contents);
            var blockSpaces = parentTplData.split('block content')[0].split('\n')[parentTplData.split('block content')[0].split('\n').length - 1];
            
            var chunks = fileContents.split('\n');
            // console.log('chunks=', chunks)
            
            fileContents = chunks[0]  + '\n';
            for (var i = 1; i < chunks.length; i++){
              fileContents += blockSpaces + chunks[i] + '\n'
            }
            // console.log('fileContents=', fileContents)

            // console.log('parentTplData=', parentTplData.replace('block content', fileContents))
            fileContents = parentTplData.replace('block content', fileContents)
            
            bemReplace(fileContents);
            
            // var fName = tpl.split('/')[tpl.split('/').length - 1];
            // var fileOutPath = __dirname.split('node_modules')[0] + 'dev/layouts/' + fName + '.jade';
            // fs.writeFile(fileOutPath, result, function (err) {
            //   return callback(null, file);
            // });

          });
        }
      }

    function rFile(filesList, num){ //read file data
      if(num < filesList.length - 1){
        fs.readFile(dataDir + '/' + filesList[num], 'utf8', function (err, data) {
          // if (err) throw err;
          data = data.replace(/\r?\n|\r/g, '');
          jadeVars += '- ' + filesList[num].split('.')[0] + ' = ' + data + '\n';
          rFile(filesList, num  + 1);
        });
      }else{
        // var _chunks = String(file.contents).split(/\n\n/g);
        // _chunks = _chunks[1].split(/\n/g);
        
        // file.contents = new Buffer(jadeVars, 'utf-8');
        parseParentTpl()
        // return callback(null, file);
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
        jadeVars = '- file = ' + JSON.stringify(fileVars) + '\n';
        parentTplName = fileVarsArr[1].split(':')[1].replace(/\s{0,}/g, '');
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
