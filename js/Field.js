var app;
app = (function (app) {
    var MINE_PROB = 0.2; // 10% chance of generating a mine
    var X_LENGTH = 1.7320508; // sqrt(3)
    var HEX_SIZE = null;

    app.game.field = function (canvasWidth, canvasHeight, width, height) {
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

        if (canvasWidth / width < canvasHeight / height) {
            var x = 2*canvasWidth/(2*width + 1);
            HEX_SIZE = x/X_LENGTH;
        } else {
            HEX_SIZE = 2 * canvasHeight / (3*height + 1);
        }

        console.log(HEX_SIZE, X_LENGTH);

        this._width = width;
        this._height = height;
        this._data = [];
        this._data.getNeighbourhood = function (y, x) {
            var neighbours = [];

            function pushFields(field, neigh, c) {
                for (var i = 0; i < c.length; i++) {
                    if (c[i][0] >= 0 && c[i][0] < field.length && c[i][1] >= 0 && c[i][1] < field[c[i][0]].length) {
                        neigh.push(field[c[i][0]][c[i][1]]);
                    }
                }
            }

            if (y % 2 == 0) {
                pushFields(this, neighbours, [
                    [y - 1, x - 1], [y - 1, x],
                    [y + 1, x - 1], [y + 1, x]
                ]);
            } else {
                pushFields(this, neighbours, [
                    [y - 1, x], [y - 1, x + 1],
                    [y + 1, x], [y + 1, x + 1]
                ]);
            }
            pushFields(this, neighbours, [
                [y, x - 1], [y, x + 1]
            ]);

            return neighbours;
        };

        _generateRandomField.call(this);
    };

    app.game.field.constructor = app.game.field;

    var _generateRandomField = function () {
        // Generate mines at random positions
        for (var y = 0; y < this._height; y++) {
            var row = [];
            for (var x = 0; x < this._width; x++) {
                if (Math.random() < MINE_PROB) {
                    row.push(new app.game.field.mine(y, x));
                } else {
                    row.push(null);
                }
            }
            this._data.push(row);
        }

        // Fill the correct numbers
        var neigh = [];
        for (y = 0; y < this._height; y++) {
            for (x = 0; x < this._width; x++) {
                if (this._data[y][x] === null) {
                    neigh = this._data.getNeighbourhood(y, x);
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
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;

        ctx.translate(this._origin[0], this._origin[1]);
        ctx.beginPath();
        ctx.moveTo(this._points[0][0], this._points[0][1]);

        for (var i = 1; i < this._points.length; i++) {
            ctx.lineTo(this._points[i][0], this._points[i][1]);
        }
        ctx.closePath();

        ctx.stroke();
    };

    app.game.field.tile.prototype.rel = function(val) {
        return val * HEX_SIZE;
    };
    app.game.field.tile.prototype.click = function(field) {
        this._clicked = true;
    };

    app.game.field.mine = function (y, x) {
        app.game.field.tile.call(this, y, x);
    };
    app.game.field.mine.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.mine.constructor = app.game.field.mine;
    app.game.field.mine.prototype.render = function (ctx) {
        ctx.save();
        app.game.field.tile.prototype.render.call(this, ctx);

        if (this._clicked) {
            ctx.fillStyle = "red";
            ctx.fill();
        }
        ctx.restore();
    };

    app.game.field.mine.prototype.click = function(auto, field) {
        if (!auto) {
            throw "Game Over";
        }
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
            ctx.font = HEX_SIZE + "px arial";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(this._n, this.rel(X_LENGTH / 2.0), this.rel(0.5));
        }


        ctx.restore();
    };

    app.game.field.numbertile.prototype.click = function(auto, field) {
        app.game.field.tile.prototype.click.call(this, auto, field);

        if (this._n < 1) {
            var neighbours = field._data.getNeighbourhood(this._y, this._x);
            for (var i = 0; i < neighbours.length; i++) {
                if (!neighbours[i]._clicked) {
                    neighbours[i].click(true, field);
                }
            }
        }
    };

    return app;
})(app || {});
