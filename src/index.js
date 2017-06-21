import $ from 'jquery';

class Puzzle {
  constructor() {
    this.type = null;
    this.sx = -1;
    this.sy = -1;
    this.tx = -1;
    this.ty = -1;
    this.matrix = [];

    for (let i = 0; i <= 7; i++) {
      const row = [];
      for (let j = 0; j <= 7; j++) {
        row.push(null);
      }
      this.matrix.push(row);
    }
  }

  setFromEncoding(encoding) {
    this.type = encoding.charCodeAt(0) - 48;
    this.sx = encoding.charCodeAt(3) - 97;
    this.sy = 7 - (encoding.charCodeAt(4) - 49);
    this.tx = encoding.charCodeAt(1) - 97;
    this.ty = 7 - (encoding.charCodeAt(2) - 49);


    for (let i = 0; i <= 7; i++) {
      for (let j = 0; j <= 7; j++) {
        this.matrix[i][j] = null;
      }
    }

    let k = 0;
    let nr = 0;

    for (let c = 5, end = encoding.length - 1, asc = 5 <= end; asc ? c <= end : c >= end; asc ? c++ : c--) {
      const chr = encoding.charCodeAt(c);
      if (chr < 65) {
        nr = ((nr * 10) + chr) - 48;
      } else {
        k += nr;
        nr = 0;
        this.matrix[(k / 8) | 0][k % 8] = encoding.charAt(c);
        k++;
      }
    }

    // White always moves, but sometimes the start and end positions are
    // reversed. Check if the start piece is white, if not, reverse the start
    // and end positions.
    const sPiece = this.matrix[this.sy][this.sx];
    if ((sPiece === null) || (sPiece.charCodeAt(0) >= 97)) {
      let tmp = this.sx;
      this.sx = this.tx;
      this.tx = tmp;
      tmp = this.sy;
      this.sy = this.ty;
      this.ty = tmp;
    }
  }
}

class HtmlBoard {
  constructor(elem, page) {
    this.elem = elem;
    this.page = page;
    this.matrix = [];
    this.puzzle = new Puzzle();
    this.classes = {
      p: 'bp',
      b: 'bb',
      n: 'bn',
      r: 'br',
      q: 'bq',
      k: 'bk',
      P: 'wp',
      B: 'wb',
      N: 'wn',
      R: 'wr',
      Q: 'wq',
      K: 'wk',
    };
  }

  construct() {
    for (let y = 0; y <= 7; y++) {
      const row = [];
      for (let x = 0; x <= 7; x++) {
        var square = $('<div class="square"></div>');
        if ((((8 * y) + x + (((y % 2) === 0) ? 0 : 1)) % 2) === 0) {
          square.addClass('ws');
        } else {
          square.addClass('bs');
        }
        ((x, y) => {
          return square.mousedown(() => this.page.onSelected(x, y));
        })(x, y);
        this.elem.append(square);
        row.push(square);
      }
      this.matrix.push(row);
    }
  }

  setPuzzle(encoding) {
    this.puzzle.setFromEncoding(encoding);
    for (let y = 0; y <= 7; y++) {
      for (let x = 0; x <= 7; x++) {
        const square = this.matrix[y][x];
        square.empty();
        const piece = $('<div class="piece"></div>');
        piece.addClass(this.classes[this.puzzle.matrix[y][x]]);
        square.append(piece);
      }
    }
  }
}

class Page {
  constructor(puzzles) {
    this.puzzles = puzzles;
    this.done = false;
    this.selectedS = null;
    this.selectedT = null;
    this.htmlBoard = new HtmlBoard($('#board-container'), this);
    this.message = $('#message');
    this.newBtn = $('#new-btn');
    this.startLoc = null;
    this.stopLoc = null;
    $('#show-btn').click(this.showSolution.bind(this));
    this.newBtn.click(this.newOne.bind(this));
    this.msg = {
      3: 'White moves. Find the fork.',
      4: 'White moves. Find the pin.',
      5: 'White moves. Mate in one move.',
      6: 'White moves. Mate in two moves.',
      7: 'White moves. Avoid mate.',
      wrong: 'Incorrect.',
      right: 'Correct!'
    };
  }

  getRandomPuzzle() {
    let n = (this.puzzles.length * Math.random()) | 0;
    return this.puzzles[n];
  }

  setup() {
    this.htmlBoard.construct();
    return this.newOne();
  }

  newOne() {
    this.done = false;
    this.htmlBoard.setPuzzle(this.getRandomPuzzle());
    this.message.text(this.msg[this.htmlBoard.puzzle.type]);
    if (this.startLoc !== null) {
      this.htmlBoard.matrix[this.startLoc[1]][this.startLoc[0]].removeClass('start');
    }
    if (this.stopLoc !== null) {
      this.htmlBoard.matrix[this.stopLoc[1]][this.stopLoc[0]].removeClass('stop');
    }
    if (this.selectedS !== null) {
      this.htmlBoard.matrix[this.selectedS[1]][this.selectedS[0]].removeClass('selected');
    }
    this.startLoc = null;
    this.stopLoc = null;
    return this.selectedS = null;
  }

  onSelected(x, y) {
    if (this.done) { return; }
    if (this.selectedS === null) {
      const piece = this.htmlBoard.puzzle.matrix[y][x];
      if ((piece !== null) && (piece.charCodeAt(0) < 97)) {
        this.selectedS = [
          x,
          y
        ];
        this.htmlBoard.matrix[y][x].addClass('selected');
      }
    } else if ((this.selectedS[0] === x) && (this.selectedS[1] === y)) {
      this.htmlBoard.matrix[y][x].removeClass('selected');
      this.selectedS = null;
    } else {
      this.selectedT = [
        x,
        y
      ];
      this.checkResult();
    }
  }

  checkResult() {
    let p = this.htmlBoard.puzzle;
    let mat = this.htmlBoard.matrix;
    let s = this.selectedS;
    let t = this.selectedT;
    this.selectedS = null;
    this.selectedT = null;
    mat[s[1]][s[0]].removeClass('selected');
    if ((s[0] === p.sx) && (s[1] === p.sy) && (t[0] === p.tx) && (t[1] === p.ty)) {
      this.showSolution();
      this.message.text(this.msg.right);
    } else {
      this.message.text(this.msg.wrong);
      setTimeout(() => {
        return this.message.text(this.msg[this.htmlBoard.puzzle.type]);
      }
      , 1000);
    }
  }

  showSolution() {
    if (this.done) { return; }
    let p = this.htmlBoard.puzzle;
    this.htmlBoard.matrix[p.sy][p.sx].addClass('start');
    this.htmlBoard.matrix[p.ty][p.tx].addClass('stop');
    this.startLoc = [p.sx, p.sy];
    this.stopLoc = [p.tx, p.ty];
    return this.done = true;
  }
}

function main() {
  $.ajax({
    url: 'data.txt',
  }).done((data) => {
    const array = data.split('\n');
    if (array[array.length - 1].length === 0) {
      array.splice(array.length - 1, 1);
    }
    new Page(array).setup();
  });
}

main();
