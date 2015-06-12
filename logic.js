var size = 15;
var turn = 0;
var hand = [];
var board = [];
var alphabet = "abcdefghijklmnopqrstuvwxyz ";
var count = [9,2,2,4,12,2,3,2,9,1,1,4,2,6,8,2,1,6,4,6,4,2,2,1,2,1,2];
var value = [1,3,3,2,1,4,2,4,1,8,5,1,3,1,1,3,10,1,1,1,1,4,4,8,4,10,0];
var letterBag = [];

function init() {
  dictionary = new Dictionary(loadWords());
  for (var i=0; i<count.length; i++) {
    for (var j=0; j<count[i]; j++) {
      letterBag.push(alphabet.charAt(i));
    }
  }
  for (var i=0; i<letterBag.length; i++) {
    var t = Math.floor(Math.random()*i);
    var tv = letterBag[t];
    letterBag[t] = letterBag[i];
    letterBag[i] = tv;
  }
  hand = drawLetters(7);
  // Make data for board
  for(var i=size;i--;) {
    board[i] = [];
  }
  drawBoard();
}

function drawLetters(number) {
  if('undefined' === typeof number) {
    number = 7;
  }
  return letterBag.splice(0, number);
}

function playTurn() {
  placeWord();
  var newLetters = drawLetters(7 - hand.length);
  for(var i=0;i<newLetters.length;i++) {
    hand.push(newLetters[i]);
  }
  drawBoard();
  turn++;
}

// --- RENDERING --- //
function placeWord(word,x,y,dir) {
  if(!word) {
    word = findBestWord();
  }
  if(word instanceof Object) { // Word object
    document.getElementById('scorecard').innerHTML += "<b>" + word.value +"</b> : "+ word.score+"pts<br/>";
    x = word.x;
    y = word.y;
    dir = word.dir;
    word = word.value;
  }
  word = word.toLowerCase();
  for (var i=0; i<word.length; i++) {
    hand.splice(hand.indexOf(word.charAt(i)), 1);
  }
  if(dir == 0) { // RIGHT
    for(var i=word.length;i--;) {
      board[y][x+i] = word.charAt(i);
    }
  } else {    // UP
    for(var i=word.length;i--;) {
      board[y+i][x] = word.charAt(i);
    }
  }
}

// --- AI --- //
function findBestWord() {
  var data;
  var candidates = [];
  if(turn == 0) {
    data = getData(7, '?');
    data.ex = ["."];
    var word = highestWord(data, 7, '?');
    word.score *= 2;
    console.log(word);
    return word;
  } else {
    for(var i=0;i<size;i++) {
      var rowData = getData(i, '?');
      if(rowData.fl > -1 || rowData.sw.length > 0) {
        console.log('row'+i);
        var word = highestWord(rowData, i, '?');
        console.log(word);
        candidates.push(word);
      }
      var colData = getData('?', i);
      if(colData.fl > -1 || colData.sw.length > 0) {
        console.log('col'+i);
        var word = highestWord(colData, '?', i);
        console.log(word);
        candidates.push(word);
      }
    }
    console.log(candidates);
    console.log('reduce');
    var word = candidates.reduce(function(prev,word,i,a){
      if(word.score > prev.score) {
        return word;
      } else {
        return prev;
      }
    });
    console.log(word);
    return word;
  }
}
function getData(xs, ys) {
  var row, col;
  if(xs == '?') {
    var t = [];
    xs = [];
    for(var i=0;i<size;i++) {
      xs[i] = i;
      t[i] = ys;
    }
    ys = t;
    row = 0;
    col = 1;
  } else {
    var t = [];
    ys = [];
    for(var i=0;i<size;i++) {
      ys[i] = i;
      t[i] = xs;
    }
    xs = t;
    row = 1;
    col = 0;
  }
  var data = {
    lm:[],
    wm:[],
    ex:[],
    sw:[],
    ls:hand.slice(0),
    fl:-1
  };
  var last;
  for(var i=0;i<size;i++) {
    if(board[xs[i]][ys[i]]) {
      data.ls.push(board[xs[i]][ys[i]]);
    }
  }
  //console.log(data.ls);
  for(var i=0;i<size;i++) {
    if(board[xs[i]][ys[i]]) {
      if(data.fl == -1) data.fl = i;
      data.ex.push(board[xs[i]][ys[i]]);
    } else {
      var parallel = false;
      // check both!
      // check left/up
      if(xs[i]-row >= 0 && ys[i]-col >= 0 && board[xs[i]-row][ys[i]-col]) {
        var sideWord = board[xs[i]-row][ys[i]-col];
        var x = xs[i]-row-row;
        var y = ys[i]-col-col;
        while(x >= 0 && y >= 0 && board[x][y]) {
          sideWord = board[x][y] + sideWord;
          x -= row;
          y -= col;
        }
        data.sw[i] = {
          value:sideWord,
          side:-1
        }
        var sideMatches = dictionary.search('^'+sideWord+'.$');
        if(sideMatches.length > 0) {
          var regex = "[";
          for(var j=0;j<sideMatches.length;j++) {
            var letter = sideMatches[j].substr(sideMatches[j].length-1);
            if(data.ls.indexOf(letter) > -1) {
              regex += letter;
            }
          }
          if(regex.length == 1) {
            regex = "!";
          } else {
            regex += "]";
          }
          data.ex.push(regex);
        } else {
          data.ex.push("!");
        }
        parallel = true;
      }
      // check right/down
      if(xs[i]+row < size && ys[i]+col < size && board[xs[i]+row][ys[i]+col]) {
        var sideWord = board[xs[i]+row][ys[i]+col];
        var x = xs[i]+row+row;
        var y = ys[i]+col+col;
        while(x < size && y < size && board[x][y]) {
          sideWord += board[x][y];
          x += row;
          y += col;
        }
        data.sw[i] = {
          value:sideWord,
          side:1
        }
        var sideMatches = dictionary.search('^.'+sideWord+'$');
        if(sideMatches.length > 0) {
          var regex = "[";
          for(var j=0;j<sideMatches.length;j++) {
            var letter = sideMatches[j].substr(0,1);
            if(data.ls.indexOf(letter) > -1) {
              regex += letter;
            }
          }
          if(regex.length == 1) {
            regex = "!";
          } else {
            regex += "]";
          }
          data.ex.push(regex);
        } else {
          data.ex.push("!");
        }
        parallel = true;
      }
      if(!parallel) {
        // just add wild card, trim later
        data.ex.push(".");
      }
    }
    switch(spaceType(xs[i],ys[i])) {
      case -1:
        data.wm.push(1);
        data.lm.push(2);
        break;
      case -2:
        data.wm.push(1);
        data.lm.push(3);
        break;
      case 1:
        data.wm.push(2);
        data.lm.push(1);
        break;
      case 2:
        data.wm.push(3);
        data.lm.push(1);
        break;
      default:
        data.wm.push(1);
        data.lm.push(1);
    }
  }
  return data;
}

function highestWord(data, row, col) {
  //console.log(data);
  var words = possibleWords(data);
  var word = words.reduce(function(prev,word,i,a) {
    var score = scoreWord(word, data);
    if(score > prev.score) {
      if(row == '?') {
        return {
          score:score,
          value:word.value,
          x:col,
          y:word.pos,
          dir:1
        };
      } else {
        return {
          score:score,
          value:word.value,
          x:word.pos,
          y:row,
          dir:0
        };
      }
    }
    // if equal, use less common letters
    return prev;
  }, {score:0,value:""});
  //console.log(word);
  return word;
}

function possibleWords(data) {
  // GET ALL WORDS THAT CONTAIN THE RIGHT LETTERS
  var words = dictionary.match(data.ls);
  // REDUCE TO WORDS THAT CAN ACTUALLY FIT HERE
  var tests = generateRegExp(data.ex);
  if(turn == 0) tests = [{
    test:new RegExp(".","g"),
    pos:7
  }];
  console.log(tests);
  // GET LOCATIONS OF ALL POSSIBLE WORDS or -1
  var passwords = [];
  for(var w=words.length;w--;) {
    for(var t=tests.length;t--;) {
      if(wordTest(tests[t].test, words[w])) { // Only match words with regex that match their length
        if(tests[t].test.source.indexOf('^') >-1 || tests[t].test.source.indexOf('$') > -1) {
          var pos = tests[t].pos;
          if(tests[t].test.source.indexOf('^') < 0) {
            pos = pos+regexLength(tests[t].test)-words[w].length;
          }
          passwords.push({
            pos:pos,
            value:words[w],
            test:tests[t].test
          });
        } else if(turn > 0) {
          var temp = words[w];
          var indent = 0;
          do {
            var index = temp.search(tests[t].test);
            passwords.push({
              pos:tests[t].pos-indent-index,
              value:words[w],
              test:tests[t].test
            });
            indent += index+1;
            temp = temp.substr(indent);
          } while(temp.indexOf(tests[t].test.source) > -1);
        } else {
          // FIRST TURN, CONSIDER EVERY POSITION
          for(var i=words[w].length;i--;) {
            passwords.push({
              pos:tests[t].pos-i,
              value:words[w],
              test:tests[t].test.source
            });
          }
        }
      }
    }
  }
  //console.log(passwords);
  return passwords;
}
function wordTest(regex, word) {
  if(letterTest(regex, word) && (regex.source.indexOf('^') < 0
  || regex.source.indexOf('$') < 0 || regexLength(regex) == word.length)) {
    return word.match(regex) != null;
  }
  return false;
}
function letterTest(regex, word) {
  var handStr = hand.join('');
  regex = regex.source.replace(/[\^\$]/g,'');
  var inbetween = regex.replace(/\[[^\]]*\]/g,"");
  var letters = handStr+inbetween;
  for(var i=word.length;i--;) {
    var index = letters.lastIndexOf(word.charAt(i));
    if(index < 0) {
      return false;
    } else {
      letters = letters.substr(0, index)+'!'+letters.substr(index+1);
    }
  }
  return handStr != letters.substring(0,7);
}
function regexLength(regex) {
  if(regex.source) {
    regex = regex.source;
  }
  regex = regex.replace(/[\^\$]/g,'');
  if(regex.indexOf("[") < 0) {
    return regex.length;
  }
  return regex.split("[").length - regex.replace(/\[[^\]]*\]/g,"").length - 1;
}

function generateRegExp(op) {
  op = op.join(''); // combine into string
  var start = op.length;
  op = op.replace(/^\.\.*/, ''); // ltrim .'s
  start -= op.length;
  op = op.replace(/\.\.*$/, ''); // rtrim .'s
  //console.log(op);
  var op2 = op.replace(/\./g,"[a-z]");
  var bsplit = op2.split("[");
  var tokens = [];
  for(var i=0;i<bsplit.length;i++) {
    if(bsplit[i].length == 0) {
      continue;
    }
    if(bsplit[i].indexOf(']') < 0) {
      tokens.push(bsplit[i]);
    } else {
      var t = bsplit[i].split(']');
      tokens.push('['+t[0]+']');
      if(t[1].length > 0) {
        tokens.push(t[1]);
      }
    }
  }
  var exp = [];
  for(var i=0;i<tokens.length;i++) {
    var s = i+1;
    var pre = false;
    var str = "";
    if(i > 0) {
      str += '^';
      if(tokens[i-1].charAt(tokens[i-1].length-1) != ']') {
        str += tokens[i-1];
        pre = true;
      } else {
        start += regexLength(tokens[i-1]);
      }
    }
    str += tokens[i];
    if(i<tokens.length-1 && tokens[i+1].charAt(0) != '[') {
      str += tokens[s++];
    }
    if(i < tokens.length-1) {
      exp.push({
        test:new RegExp(str+"$","g"),
        pos:start
      });
    } else {
      exp.push({
        test:new RegExp(str,"g"),
        pos:start
      });
    }
    for(var j=s;j<tokens.length;j++) {
      str += tokens[j];
      if(j<tokens.length-1 && tokens[j+1].charAt(0) != '[') {
        str += tokens[j+1];
        j++;
      }
      if(j < tokens.length-1) {
        exp.push({
          test:new RegExp(str+"$","g"),
          pos:start
        });
      } else {
        exp.push({
          test:new RegExp(str,"g"),
          pos:start
        });
      }
    }
    //console.log(exp[exp.length-1].test.source);
    if(pre) {
      start += regexLength(tokens[i-1]);
    }
  }
  exp = exp.sort().filter(function(op, i, array) {
    return op.test.source.indexOf('!') < 0 && (i == 0 || op.test.source != array[i-1].test.source);
  });
  //exp.map(function(op) {return op.replace("[a-z]",".")});
  return exp;
}

function scoreWord(word, data) {
  var score = 0;
  var side = 0;
  var wmult = 1;
  for(var i=0;i<word.value.length;i++) {
    var j = i+word.pos;
    score += data.lm[j]*value[alphabet.indexOf(word.value.charAt(i))];
    wmult *= data.wm[j];
    if(data.sw[j]) {
      for(var k=data.sw[j].value.length;k--;) {
        var sws = 0;
        sws += value[alphabet.indexOf(data.sw[j].value.charAt(k))];
        sws += data.lm[j]*value[alphabet.indexOf(word.value.charAt(i))];
        side += sws*data.wm[j];
        //console.log(word.value+' : side : '+data.sw[j].value+word.value.charAt(i)+' : '+side);
      }
    }
  }
  return (score*wmult)+side;
}

// --- WORD LIST --- //
var dictionary;
function Dictionary(wordList) {
  this.words = wordList;
  this.twowords = [];
  for(var i=0;i<wordList.length;i++) {
    if(wordList[i].length == 2) {
      this.twowords.push(i);
    }
  }
  this.match = function(letters) {
    if (letters instanceof Array) {
      letters = letters.join('');
    }
    var blanks = 0;
    for(var i=letters.length;i--;) {
      if(letters.charAt(i) == ' ') {
        blanks++;
      }
    }
    var maxLength = letters.length;
    letters = letters.toLowerCase();
    // FILTER OUT ALL THE WORDS THAT HAVE LETTERS THAT WE DON'T
    return this.words.filter(function(word,index,array) {
      if(word.length > maxLength) { // TOO LONG
        return false;
      }
      for(var i=word.length;i--;) {
        if(letters.indexOf(word.charAt(i)) < 0 && blanks-- == 0) {
          return false;
        }
      }
      return true;
    });
  };
  this.valid = function(word) {
    // Binary Search
    word = word.toLowerCase();
    if(word.length == 2) {
      var top = 0;
      var bottom = this.twowords.length-1;
      while(bottom-top > 1) {
        var middle = Math.floor((top+bottom)/2);
        if(this.words[this.twowords[middle]] == word) {
          return true;
        }
        if(this.words[this.twowords[middle]] > word) {
          bottom = middle;
        } else {
          top = middle;
        }
      }
      return this.words[this.twowords[top]] == word || this.words[this.twowords[bottom]] == word;
    } else {
      var top = 0;
      var bottom = this.words.length-1;
      while(bottom-top > 1) {
        var middle = Math.floor((top+bottom)/2);
        if(this.words[middle] == word) {
          return true;
        }
        if(this.words[middle] > word) {
          bottom = middle;
        } else {
          top = middle;
        }
      }
      return this.words[top] == word || this.words[bottom] == word;
    }
  }
  this.search = function(regex) {
    if(regexLength(regex) > 2) {
      return this.words.filter(function(word,index,array) {
        return word.match(regex) != null;
      });
    } else {
      var m = [];
      for(var i=this.twowords.length;i--;) {
        if(this.words[this.twowords[i]].match(regex)) {
          m.push(this.words[this.twowords[i]]);
        }
      }
      return m;
    }
  }
}
function loadWords() {
  var request = (window.XMLHttpRequest)
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");
  request.open("GET","./dictionary.txt",false);
  request.send();
  return request.responseText.split("\n");
}

function spaceType(i,j) {
  if(board[i][j]) {
    return 0;
  }
  var center = Math.floor(size/2);
  var edge = size-1;
  if((i == j)||(edge-i == j)) {
    if(i == 0 || j == 0 || i == edge) {
      return 2; // TRIPLE WORD
    }
    if((i<center-2||i>center+2)&&(j<center-2||j>center+2)) {
      return 1; // DOUBLE WORD
    } else if(i==center) {
      return 3; // STAR
    } else if(i == center-2 || i == center+2) {
      return -2; // TRIPLE LETTER
    } else {
      return -1; // TRIPLE WORD
    }
  // TRIPLE WORD
  } else if(i == 0 && j == center
    || i == edge && j == center
    || i == center && j == 0
    || i == center && j == edge) {
      return 2; // TRIPLE WORD
  // TRIPLE LETTER
  } else if((Math.abs(center-i) == 2 && Math.abs(center-j) == Math.floor(edge/2)-1)
          ||(Math.abs(center-j) == 2 && Math.abs(center-i) == Math.floor(edge/2)-1)) {
      return -2; // TRIPLE LETTER
  // DOUBLE LETTER
  } else if((Math.abs(center-i) == 4 && (j == 0 || j == edge))
         || (Math.abs(center-j) == 4 && (i == 0 || i == edge))
         ||((i>center-2&&i<center+2) && Math.abs(center-j)>3 && Math.abs(center-j) == Math.abs(center-i)+4)
         ||((j>center-2&&j<center+2) && Math.abs(center-i)>3 && Math.abs(center-i) == Math.abs(center-j)+4)) {
    return -1; // DOUBLE LETTER
  }
  return 0;
}

function tileLetter(letter) {
  letter = letter.toUpperCase();
  var etch = letter+'<span>';
  if(letter == 'I') {
    etch += ' ';
  }
  if(letter != ' ') {
    return etch + value[alphabet.toUpperCase().indexOf(letter)]+'</span>';
  }
  return etch+'</span>';
}
function drawBoard() {
  var html = "";
  for(var i=0;i<size;i++) {
    html += "<tr>";
    for(var j=0;j<size;j++) {
      html += "<td";
      switch(spaceType(i,j)) {
        case 1:
          html+=' class="dW"';
          break;
        case 2:
          html+=' class="tW"';
          break;
        case -1:
          html+=' class="dL"';
          break;
        case -2:
          html+=' class="tL"';
          break;
        case 3:
          html+=' class="S"';
      }
      if(board[i][j]) {
        html += ' class="tile">'+tileLetter(board[i][j])+'</td>';
      } else {
        html += ">&nbsp;</td>";
      }
    }
    html += "</tr>";
  }
  document.getElementById("board").innerHTML = html;

  html = "<tr>";
  for(var i=0,end=hand.length;i<end;i++) {
    html += '<td class="tile">'+tileLetter(hand[i])+'</span></td>';
  }
  html += "</tr>";
  document.getElementById("rack").innerHTML = html;
}