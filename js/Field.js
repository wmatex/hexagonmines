var app = (function (app) {
    var X_LENGTH = 1.7320508; // sqrt(3)
    var HEX_SIZE = null;
    var MARGIN = 2;
    var NUMBER = 0;
    var MINE = 1;

    app.game.field = function (canvas, width, height, mineCount) {
        var canvasHeight = canvas.height - 2*MARGIN;
        var canvasWidth = canvas.width - 2*MARGIN;
        if (canvasWidth > canvasHeight) {
            if (height > width) {
                var tmp = width;
                width = height;
                height = tmp;
            }
        } else {
            if (width > height) {
                var tmp = width;
                width = height;
                height = tmp;
            }
        }

        this._cW = canvasWidth;
        this._cH = canvasHeight;

        var x = 2*canvasWidth/(2*width + 1);
        var h1 = x/X_LENGTH;
        var h2 = 2 * canvasHeight / (3*height + 1);

        HEX_SIZE = Math.min(h1, h2);

        var realWidth = width*HEX_SIZE*X_LENGTH + 0.5*HEX_SIZE*X_LENGTH +2*MARGIN
        console.log(width, realWidth, canvasWidth);
        if (realWidth < canvasWidth) {
            canvas.width = realWidth;
            this._cW = realWidth;
        }

        this._width = width;
        this._height = height;
        this._data = [];
        this._mines = mineCount;

        _generateRandomField.call(this);
    };

    app.game.field.constructor = app.game.field;
    app.game.field.prototype.getNeighbourhood = function (y, x) {
        var neighbours = [];

        function pushFields(field, neigh, c) {
            for (var i = 0; i < c.length; i++) {
                if (c[i][0] >= 0 && c[i][0] < field.length && c[i][1] >= 0 && c[i][1] < field[c[i][0]].length) {
                    neigh.push(field[c[i][0]][c[i][1]]);
                }
            }
        }

        if (y % 2 == 0) {
            pushFields(this._data, neighbours, [
                [y - 1, x - 1], [y - 1, x],
                [y + 1, x - 1], [y + 1, x]
            ]);
        } else {
            pushFields(this._data, neighbours, [
                [y - 1, x], [y - 1, x + 1],
                [y + 1, x], [y + 1, x + 1]
            ]);
        }
        pushFields(this._data, neighbours, [
            [y, x - 1], [y, x + 1]
        ]);

        return neighbours;
    };

    var _generateRandomField = function () {
        var m = 0;
        var positions = [];
        while (m < this._mines) {
            var pos = parseInt(Math.random() * this._height*this._width);
            if (positions.indexOf(pos) < 0) {
                positions.push(pos);
                m++;
            }
        }
        positions.sort(function(a, b) {
            return a-b;
        });
        pos = 0;
        var i = 0;
        // Generate mines at random positions
        for (var y = 0; y < this._height; y++) {
            var row = [];
            for (var x = 0; x < this._width; x++) {
                if (pos == positions[i]) {
                    row.push(new app.game.field.mine(y, x));
                    i++;
                } else {
                    row.push(null);
                }
                pos++;
            }
            this._data.push(row);
        }

        // Fill the correct numbers
        var neigh = [];
        for (y = 0; y < this._height; y++) {
            for (x = 0; x < this._width; x++) {
                if (this._data[y][x] === null) {
                    neigh = this.getNeighbourhood(y, x);
                    var nMines = 0;
                    for (var i = 0; i < neigh.length; i++) {
                        if (neigh[i] instanceof app.game.field.mine) {
                            nMines++;
                        }
                    }
                    this._data[y][x] = new app.game.field.numbertile(y, x, nMines);
                }
            }
        }
    };

    app.game.field.prototype.markMines = function() {
      for (var y = 0; y < this._data.length; y++) {
          for (var x = 0; x < this._data[y].length; x++) {
              if (this._data[y][x] instanceof app.game.field.mine) {
                  this._data[y][x].show();
              }
          }
      }
    };

    app.game.field.prototype.getUnderCursor = function(x, y) {
        var yIndex = Math.floor(y/(HEX_SIZE*1.5));
        var xIndex = Math.floor(x/(X_LENGTH*HEX_SIZE)) - 1;

        for (var i = 0; i < 2; i++) {
            yIndex += i;
            for (var j = 0; j < 2; j++) {
                xIndex += j;
                if (yIndex < this._height && xIndex >= 0 && xIndex < this._width) {
                    if (this._data[yIndex][xIndex].inside(x,y)) {
                        return this._data[yIndex][xIndex];
                    }
                }
            }
        }
    };

    app.game.field.prototype.checkMarks = function() {
        var marks = 0;
        for (var y = 0; y < this._data.length; y++) {
            for (var x = 0; x < this._data[y].length; x++) {
                if (this._data[y][x]._marked && this._data[y][x] instanceof app.game.field.mine) {
                    marks++;
                } else if (this._data[y][x]._marked && ! (this._data[y][x] instanceof app.game.field.mine)) {
                    return -1;
                }
            }
        }

        return marks;
    };

    app.game.field.prototype.serialize = function() {
        var serialized = {
            width: this._width,
            height: this._height,
            data: []
        };

        for (var y = 0; y < this._data.length; y++) {
            for (var x = 0; x < this._data[y].length; x++) {
                var tile = this._data[y][x];
                serialized.data.push({
                    clicked: tile._clicked,
                    marked: tile._marked,
                    type: tile instanceof app.game.field.mine ? MINE : NUMBER,
                    number: tile._n
                });
            }
        }

        return serialized;
    };

    app.game.field.prototype.load = function(serialized) {
        this._width = serialized.width;
        this._height = serialized.height;

        this._data = [];
        var i = 0;
        this._mines = 0;
        for (var y = 0; y < this._height; y++) {
            var row = [];
            for (var x = 0; x < this._width; x++) {
                var tile = serialized.data[i];
                if (tile.type == MINE) {
                    var t = new app.game.field.mine(y,x);
                    this._mines++;
                } else {
                    var t = new app.game.field.numbertile(y, x, tile.number);
                }
                t._clicked = tile.clicked;
                t._marked = tile.marked;
                row.push(t);
                i++;
            }
            this._data.push(row);
        }
    };

    app.game.field.prototype.resize = function(canvas) {

    };

    app.game.field.prototype.render = function (ctx) {
        ctx.clearRect(0, 0, this._cW, this._cH);
        for (var y = 0; y < this._data.length; y++) {
            for (var x = 0; x < this._data[y].length; x++) {
                this._data[y][x].render(ctx);
            }
        }
    };

    app.game.field.tile = function (y, x) {
        this._y = y;
        this._x = x;

        this._clicked = false;
        this._marked = false;

        var offset = this._y % 2 == 1 ? this.rel(X_LENGTH/2.0) : 0;
        this._origin = [offset+this._x*this.rel(X_LENGTH), this.rel(0.5) + this.rel(1.5*this._y)];
        this._points = [
            [0 , 0],
            [ Math.round(this.rel(X_LENGTH/2.0)), Math.round(-this.rel(0.5)) ],
            [ Math.round(this.rel(X_LENGTH)), Math.round(this.rel(0)) ],
            [ Math.round(this.rel(X_LENGTH)), Math.round(this.rel(1)) ],
            [ Math.round(this.rel(X_LENGTH/2.0)), Math.round(this.rel(1.5)) ],
            [ Math.round(this.rel(0)), Math.round(this.rel(1)) ],
        ];
    };

    app.game.field.tile.constructor = app.game.field.tile;


    app.game.field.tile.prototype.inside = function(x, y) {
        function sign(x1, y1, x2, y2, x, y) {
            return y - y1 - (y2 - y1)/(x2 - x1)*(x - x1);
        }

        for (var i = 1; i < this._points.length; i++) {
            if (!sign(this._points[i-1][0], this._points[i-1][0], this._points[i][0], this._points[i][1], x-this._origin[0], y-this._origin[1])) {
                return false;
            }
        }
        return x > this._origin[0] && x < this._origin[0] + X_LENGTH*HEX_SIZE;
    };

    app.game.field.tile.prototype.render = function (ctx) {
        if (this._clicked) {
            ctx.fillStyle = "#cccccc";
        } else {
            ctx.fillStyle = "#eeeeee";
        }
        ctx.lineWidth = 1;

        ctx.translate(this._origin[0], this._origin[1]);
        ctx.beginPath();
        ctx.moveTo(this._points[0][0], this._points[0][1]);

        for (var i = 1; i < this._points.length; i++) {
            ctx.lineTo(this._points[i][0], this._points[i][1]);
        }
        ctx.closePath();

        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();

        if (this._marked) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.moveTo(this.rel(X_LENGTH/2.0), this.rel(1));
            ctx.lineTo(this.rel(X_LENGTH/2.0), 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = "red";
            ctx.moveTo(this.rel(X_LENGTH*0.5), 0);
            ctx.lineTo(this.rel(X_LENGTH*0.80), this.rel(0.25));
            ctx.lineTo(this.rel(X_LENGTH*0.5), this.rel(0.5));
            ctx.closePath();
            ctx.fill();
        }
    };

    app.game.field.tile.prototype.rel = function(val) {
        return val * HEX_SIZE;
    };
    app.game.field.tile.prototype.click = function(auto, field) {
        this._clicked = true;
        this._marked = false;
    };

    app.game.field.tile.prototype.markToggle = function() {
        if (!this._clicked) {
            this._marked = !this._marked;
            return true;
        } else {
            return false;
        }
    };

    app.game.field.mine = function (y, x) {
        app.game.field.tile.call(this, y, x);
        this._showed = false;

    };
    app.game.field.mine.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.mine.constructor = app.game.field.mine;

    app.game.field.mine.prototype.render = function (ctx) {
        ctx.save();
        app.game.field.tile.prototype.render.call(this, ctx);

        if (this._showed) {
            if (this._clicked) {
                ctx.fillStyle = 'red';
            }
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = 'black';
            ctx.arc(this.rel(X_LENGTH) / 2, HEX_SIZE/2, HEX_SIZE*0.5, 0, Math.PI*2);
            ctx.fill();
            ctx.moveTo(this.rel(X_LENGTH) * 0.75, HEX_SIZE * 0.25);
            ctx.bezierCurveTo(this.rel(X_LENGTH)*0.75, -HEX_SIZE*0.25, this.rel(X_LENGTH), HEX_SIZE*0.5, this.rel(X_LENGTH) * 0.9, 0.1);
            ctx.stroke();
        }

        ctx.restore();
    };

    app.game.field.mine.prototype.click = function(auto, field) {
        if (!this._marked) {
            app.game.field.tile.prototype.click.call(this, auto, field);
            if (!auto) {
                throw "Game Over";
            }
        }
    };

    app.game.field.mine.prototype.show = function() {
        this._showed = true;
    };


    app.game.field.numbertile = function (y, x, number) {
        app.game.field.tile.call(this, y, x);
        this._n = number;
    };
    app.game.field.numbertile.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.numbertile.constructor = app.game.field.numbertile;
    app.game.field.numbertile.prototype.render = function (ctx) {
        ctx.save();
        app.game.field.tile.prototype.render.call(this, ctx);

        if (this._clicked && this._n > 0) {
            ctx.fillStyle = "black";
            ctx.font = HEX_SIZE + "px arial bold";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(this._n, this.rel(X_LENGTH / 2.0), this.rel(0.5));
        }


        ctx.restore();
    };

    app.game.field.numbertile.prototype.click = function(auto, field) {
        if (!this._marked) {
            app.game.field.tile.prototype.click.call(this, auto, field);

            if (this._n < 1) {
                var neighbours = field.getNeighbourhood(this._y, this._x);
                for (var i = 0; i < neighbours.length; i++) {
                    if (!neighbours[i]._clicked) {
                        neighbours[i].click(true, field);
                    }
                }
            }
        }
    };

    return app;
})(app || {game: {}});
