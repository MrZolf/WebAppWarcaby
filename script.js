window.onload = function () {
  var gameBoard = [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0]
  ];

  var pieces = [];
  var tiles = [];

  var calculateDistance = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }

  function displayPopup(elementId, message) {
    var popup = document.getElementById(elementId);
    popup.innerHTML = message;
    popup.style.display = 'block';
  }

  function closePopup(elementId) {
    var popup = document.getElementById(elementId);
    popup.style.display = 'none';
  }

  $('#cleargame').on("click", function () {
    Board.clearBoard();
  });

  function Piece(element, position) {
    this.allowedToMove = true;
    this.element = element;
    this.position = position;
    this.player = '';
    if (parseInt(this.element.attr("id")) < 12)
      this.player = 1;
    else
      this.player = 2;
    this.king = false;
    this.makeKing = function () {
      this.element.css("backgroundImage", "url('img/king.png')");
      this.king = true;
    }
    this.movePiece = function (tile) {
      this.element.removeClass('selected');
      if (!Board.isValidPlaceToMove(tile.position[0], tile.position[1])) return false;
      if (this.player == 1 && !this.king && tile.position[0] < this.position[0]) return false;
      if (this.player == 2 && !this.king && tile.position[0] > this.position[0]) return false;
      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      this.element.css('top', Board.positionDictionary[this.position[0]]);
      this.element.css('left', Board.positionDictionary[this.position[1]]);
      if (!this.king && (this.position[0] == 0 || this.position[0] == 7))
        this.makeKing();
      return true;
    };

    this.canJumpAnyPiece = function () {
      return (this.canJumpOpponent([this.position[0] + 2, this.position[1] + 2]) ||
        this.canJumpOpponent([this.position[0] + 2, this.position[1] - 2]) ||
        this.canJumpOpponent([this.position[0] - 2, this.position[1] + 2]) ||
        this.canJumpOpponent([this.position[0] - 2, this.position[1] - 2]))
    };

    this.canJumpOpponent = function (newPosition) {
      var dx = newPosition[1] - this.position[1];
      var dy = newPosition[0] - this.position[0];
      if (this.player == 1 && !this.king && newPosition[0] < this.position[0]) return false;
      if (this.player == 2 && !this.king && newPosition[0] > this.position[0]) return false;
      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
      var tileToCheckX = this.position[1] + dx / 2;
      var tileToCheckY = this.position[0] + dy / 2;
      if (tileToCheckX > 7 || tileToCheckY > 7 || tileToCheckX < 0 || tileToCheckY < 0) return false;
      if (!Board.isValidPlaceToMove(tileToCheckY, tileToCheckX) && Board.isValidPlaceToMove(newPosition[0], newPosition[1])) {
        for (let pieceIndex in pieces) {
          if (pieces[pieceIndex].position[0] == tileToCheckY && pieces[pieceIndex].position[1] == tileToCheckX) {
            if (this.player != pieces[pieceIndex].player) {
              return pieces[pieceIndex];
            }
          }
        }
      }
      return false;
    };

    this.jumpOpponent = function (tile) {
      var pieceToRemove = this.canJumpOpponent(tile.position);
      if (pieceToRemove) {
        pieceToRemove.removePiece();
        return true;
      }
      return false;
    };

    this.removePiece = function () {
      this.element.css("display", "none");
      if (this.player == 1) {
        $('#player2').append("<div class='capturedPiece'></div>");
        Board.score.player2 += 1;
      }
      if (this.player == 2) {
        $('#player1').append("<div class='capturedPiece'></div>");
        Board.score.player1 += 1;
      }
      Board.board[this.position[0]][this.position[1]] = 0;
      this.position = [];
      var playerWon = Board.checkIfAnybodyWon();
      if (playerWon) {
        if (playerWon === 1) {
          displayPopup('winner', 'WYGRYWA KOLOR BIAŁY');
        } else if (playerWon === 2) {
          displayPopup('winner', 'WYGRYWA KOLOR CZARNY');
        }
      }
    }
  }

  function Tile(element, position) {
    this.element = element;
    this.position = position;
    this.isInRange = function (piece) {
      for (let k of pieces)
        if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
      if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
      if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';
      if (calculateDistance(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        return 'regular';
      } else if (calculateDistance(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
        return 'jump';
      }
    };
  }

  var Board = {
    board: gameBoard,
    score: {
      player1: 0,
      player2: 0
    },
    playerTurn: 1,
    jumpExist: false,
    continuousJump: false,
    tilesElement: $('div.tiles'),
    positionDictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
    initializeBoard: function () {
      var countPieces = 0;
      var countTiles = 0;
      for (let row in this.board) {
        for (let column in this.board[row]) {
          if (row % 2 == 1) {
            if (column % 2 == 0) {
              countTiles = this.renderTile(row, column, countTiles)
            }
          } else {
            if (column % 2 == 1) {
              countTiles = this.renderTile(row, column, countTiles)
            }
          }
          if (this.board[row][column] == 1) {
            countPieces = this.renderPlayerPieces(1, row, column, countPieces)
          } else if (this.board[row][column] == 2) {
            countPieces = this.renderPlayerPieces(2, row, column, countPieces)
          }
        }
      }
    },
    renderTile: function (row, column, countTiles) {
      this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.positionDictionary[row] + ";left:" + this.positionDictionary[column] + ";'></div>");
      tiles[countTiles] = new Tile($("#tile" + countTiles), [parseInt(row), parseInt(column)]);
      return countTiles + 1
    },
    renderPlayerPieces: function (playerNumber, row, column, countPieces) {
      $(`.player${playerNumber}pieces`).append("<div class='piece' id='" + countPieces + "' style='top:" + this.positionDictionary[row] + ";left:" + this.positionDictionary[column] + ";'></div>");
      pieces[countPieces] = new Piece($("#" + countPieces), [parseInt(row), parseInt(column)]);
      return countPieces + 1;
    },
    isValidPlaceToMove: function (row, column) {
      if (row < 0 || row > 7 || column < 0 || column > 7) return false;
      if (this.board[row][column] == 0) {
        return true;
      }
      return false;
    },
    changePlayerTurn: function () {
      if (this.playerTurn === 1) {
        $('#top-turn-container').hide();
        $('#bottom-turn-container').show();
      } else if (this.playerTurn === 2) {
        $('#top-turn-container').show();
        $('#bottom-turn-container').hide();
      } else {
        $('#top-turn-container').hide();
        $('#bottom-turn-container').hide();
      }
      this.playerTurn = this.playerTurn === 1 ? 2 : 1;
      this.checkIfJumpExist();
    },
    checkIfAnybodyWon: function () {
      if (this.score.player1 == 12) {
        return 1;
      } else if (this.score.player2 == 12) {
        return 2;
      }
      return false;
    },
    clearBoard: function () {
      location.reload();
    },
    checkIfJumpExist: function () {
      this.jumpExist = false;
      this.continuousJump = false;
      for (let k of pieces) {
        k.allowedToMove = false;
        if (k.position.length != 0 && k.player == this.playerTurn && k.canJumpAnyPiece()) {
          this.jumpExist = true;
          k.allowedToMove = true;
        }
      }
      if (!this.jumpExist) {
        for (let k of pieces) k.allowedToMove = true;
      }
      if (this.jumpExist) {
        let playerColor = this.playerTurn === 1 ? 'biały' : 'czarny';
        displayPopup('jump', `Kolor ${playerColor} musi wykonać obowiązkowe bicie`);
      } else {
        closePopup('jump');
      }
    }    
  }

  Board.initializeBoard();

  $('.piece').on("click", function () {
    var selected;
    var isPlayersTurn = ($(this).parent().attr("class").split(' ')[0] == "player" + Board.playerTurn + "pieces");
    if (isPlayersTurn) {
      if (!Board.continuousJump && pieces[$(this).attr("id")].allowedToMove) {
        if ($(this).hasClass('selected')) selected = true;
        $('.piece').each(function (index) {
          $('.piece').eq(index).removeClass('selected')
        });
        if (!selected) {
          $(this).addClass('selected');
        }
      } else {
      }
    }
  });  

  $('.tile').on("click", function () {
    if ($('.selected').length != 0) {
      var tileID = $(this).attr("id").replace(/tile/, '');
      var tile = tiles[tileID];
      var piece = pieces[$('.selected').attr("id")];
      var inRange = tile.isInRange(piece);
      if (inRange != 'wrong') {
        if (inRange == 'jump') {
          if (piece.jumpOpponent(tile)) {
            piece.movePiece(tile);
            if (piece.canJumpAnyPiece()) {
              piece.element.addClass('selected');
              Board.continuousJump = true;
            } else {
              Board.changePlayerTurn()
            }
          }
        } else if (inRange == 'regular' && !Board.jumpExist) {
          if (!piece.canJumpAnyPiece()) {
            piece.movePiece(tile);
            Board.changePlayerTurn()
          } else {
          }
        }
      }
    }
  });
}