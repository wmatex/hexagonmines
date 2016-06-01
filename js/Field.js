var app;
app = (function (app) {
    var MINE_PROB = 0.1; // 10% chance of generating a mine
    var X_LENGTH = 1.7320508; // sqrt(3)

    app.game.field = function (width, height) {
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

    app.game.field.prototype.render = function (ctx) {
        for (var y = 0; y < this._data.length; y++) {
            for (var x = 0; x < this._data[y].length; x++) {
                this._data[y][x].render(ctx);
            }
        }
    };

    app.game.field.tile = function (y, x) {
        this._y = y;
        this._x = x;
    };

    app.game.field.tile.constructor = app.game.field.tile;

    app.game.field.tile.prototype._size = 100;

    app.game.field.tile.prototype.render = function (ctx) {
        ctx.fillStyle = "black";

        var offset = this._y % 2 == 1 ? this.rel(X_LENGTH/2.0) : 0;
        var oX = offset+this._x*this.rel(X_LENGTH), oY = this.rel(0.5) + this.rel(1.5*this._y);

        ctx.beginPath();
        ctx.moveTo(Math.round(oX), Math.round(oY));

        ctx.lineTo(Math.round(oX + this.rel(X_LENGTH/2.0)), Math.round(oY - this.rel(0.5)));
        ctx.lineTo(Math.round(oX + this.rel(X_LENGTH)), Math.round(oY + this.rel(0)));
        ctx.lineTo(Math.round(oX + this.rel(X_LENGTH)), Math.round(oY + this.rel(1)));
        ctx.lineTo(Math.round(oX + this.rel(X_LENGTH/2.0)), Math.round(oY + this.rel(1.5)));
        ctx.lineTo(Math.round(oX + this.rel(0)), Math.round(oY + this.rel(1)));

        ctx.fill();
    };

    app.game.field.tile.prototype.rel = function(val) {
        return val * this._size;
    };

    app.game.field.mine = function (y, x) {
        app.game.field.tile.call(this, y, x);
    };
    app.game.field.mine.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.mine.constructor = app.game.field.mine;
    app.game.field.mine.prototype.render = function (ctx) {
        app.game.field.tile.prototype.render.call(this, ctx);
    };

    app.game.field.numbertile = function (y, x, number) {
        app.game.field.tile.call(this, y, x);
        this._n = number;
    };
    app.game.field.numbertile.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.numbertile.constructor = app.game.field.numbertile;
    app.game.field.numbertile.prototype.render = function (ctx) {
        app.game.field.tile.prototype.render.call(this, ctx);
    };

    return app;
})(app || {});
