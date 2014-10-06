main = ->
  $.ajax
    url: window.staticPath + '/data.txt'
  .done (data) ->
    array = data.split '\n'
    if array[array.length - 1].length is 0
      array.splice array.length - 1, 1
    page = new Page array
    page.setup()

class Page
  constructor: (puzzles) ->
    @puzzles = puzzles
    @done = false
    @selectedS = null
    @selectedT = null
    @htmlBoard = new HtmlBoard $('#board-container'), @
    @message = $ '#message'
    @newBtn = $ '#new-btn'
    @startLoc = null
    @stopLoc = null
    $('#show-btn').click @showSolution.bind @
    @newBtn.click @newOne.bind @
    @msg =
      3: 'White moves. Find the fork.'
      4: 'White moves. Find the pin.'
      5: 'White moves. Mate in one move.'
      6: 'White moves. Mate in two moves.'
      7: 'White moves. Avoid mate.'
      wrong: 'Incorrect.'
      right: 'Correct!'

  getRandomPuzzle: ->
    n = (@puzzles.length * Math.random()) | 0
    @puzzles[n]

  setup: ->
    @htmlBoard.construct()
    @newOne()

  newOne: ->
    @done = false
    @htmlBoard.setPuzzle @getRandomPuzzle()
    @message.text @msg[@htmlBoard.puzzle.type]
    if @startLoc isnt null
      @htmlBoard.matrix[@startLoc[1]][@startLoc[0]].removeClass 'start'
    if @stopLoc isnt null
      @htmlBoard.matrix[@stopLoc[1]][@stopLoc[0]].removeClass 'stop'
    if @selectedS isnt null
      @htmlBoard.matrix[@selectedS[1]][@selectedS[0]].removeClass 'selected'
    @startLoc = null
    @stopLoc = null
    @selectedS = null

  onSelected: (x, y) ->
    return if @done
    if @selectedS is null
      piece = @htmlBoard.puzzle.matrix[y][x]
      if piece isnt null and piece.charCodeAt(0) < 97
        @selectedS = [
          x
          y
        ]
        @htmlBoard.matrix[y][x].addClass 'selected'
    else if @selectedS[0] is x and @selectedS[1] is y
      @htmlBoard.matrix[y][x].removeClass 'selected'
      @selectedS = null
    else
      @selectedT = [
        x
        y
      ]
      @checkResult()
    return

  checkResult: ->
    p = @htmlBoard.puzzle
    mat = @htmlBoard.matrix
    s = @selectedS
    t = @selectedT
    @selectedS = null
    @selectedT = null
    mat[s[1]][s[0]].removeClass 'selected'
    if s[0] is p.sx and s[1] is p.sy and t[0] is p.tx and t[1] is p.ty
      @showSolution()
      @message.text @msg['right']
    else
      @message.text @msg['wrong']
      setTimeout =>
        @message.text @msg[@htmlBoard.puzzle.type]
      , 1000
    return

  showSolution: ->
    return if @done
    p = @htmlBoard.puzzle
    @htmlBoard.matrix[p.sy][p.sx].addClass 'start'
    @htmlBoard.matrix[p.ty][p.tx].addClass 'stop'
    @startLoc = [p.sx, p.sy]
    @stopLoc = [p.tx, p.ty]
    @done = true

class HtmlBoard
  constructor: (@elem, @page) ->
    @matrix = []
    @puzzle = new Puzzle
    @classes =
      p: 'bp'
      b: 'bb'
      n: 'bn'
      r: 'br'
      q: 'bq'
      k: 'bk'
      P: 'wp'
      B: 'wb'
      N: 'wn'
      R: 'wr'
      Q: 'wq'
      K: 'wk'

  construct: ->
    for y in [0 .. 7]
      row = []
      for x in [0 .. 7]
        square = $ '<div class="square"></div>'
        if (8 * y + x + (if (y % 2 is 0) then 0 else 1)) % 2 is 0
          square.addClass 'ws'
        else
          square.addClass 'bs'
        do (x, y) =>
          square.mousedown @page.onSelected x, y
        @elem.append square
        row.push square
      @matrix.push row
    return

  setPuzzle: (encoding) ->
    @puzzle.setFromEncoding encoding
    for y in [0 .. 7]
      for x in [0 .. 7]
        square = @matrix[y][x]
        square.empty()
        piece = $ '<div class="piece"></div>'
        piece.addClass @classes[@puzzle.matrix[y][x]]
        square.append piece
    return

class Puzzle
  constructor: ->
    @type = null
    @sx = -1
    @sy = -1
    @tx = -1
    @ty = -1
    @matrix = []

    for i in [0 .. 7]
      row = []
      for j in [0 .. 7]
        row.push null
      @matrix.push row
    return

  setFromEncoding: (encoding) ->
    @type = encoding.charCodeAt(0) - 48
    @sx = encoding.charCodeAt(3) - 97
    @sy = 7 - (encoding.charCodeAt(4) - 49)
    @tx = encoding.charCodeAt(1) - 97
    @ty = 7 - (encoding.charCodeAt(2) - 49)


    for i in [0 .. 7]
      for j in [0 .. 7]
        @matrix[i][j] = null

    k = 0
    nr = 0

    for c in [5 .. encoding.length - 1]
      chr = encoding.charCodeAt c
      if chr < 65
        nr = nr * 10 + chr - 48
      else
        k += nr
        nr = 0
        @matrix[(k / 8) | 0][k % 8] = encoding.charAt c
        k++
    return

$(document).ready main
