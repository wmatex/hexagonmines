var app = (function(app) {
    var MINE_PROB = 0.1; // 10% chance of generating a mine

    app.game.field = function(width, height) {
        app.renderable.call(this);

        this._width = width;
        this._height = height;
        this._data = [];
        this._data.getNeighbourhood = function(y, x) {
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
                [y, x-1], [y, x+1]
            ]);

            return neighbours;
        };

        this._generateRandomField();
    };

    app.game.field.prototype = Object.create(app.renderable.prototype);
    app.game.field.constructor = app.game.field;

    app.game.field.prototype._generateRandomField = function() {
        // Generate mines at random positions
        for (var y = 0; y < this._height; y++) {
            var row = [];
            for (var x = 0; x < this._width; x++) {
                if (Math.random() < MINE_PROB) {
                    row.push(new app.game.field.mine());
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
                    this._data[y][x] = new app.game.field.numbertile(nMines);
                }
            }
        }
    };

    app.game.field.prototype.render = function(ctx) {
        console.log(this._data);
    };

    app.game.field.tile = function() {
        app.renderable.call(this);
    };

    app.game.field.tile.prototype = Object.create(app.renderable);
    app.game.field.tile.constructor = app.game.field.tile;

    app.game.field.tile.prototype.render = function(ctx) {
    };

    app.game.field.mine = function() {
        app.game.field.tile.call(this);
    };
    app.game.field.mine.prototype = Object.create(app.game.field.tile);
    app.game.field.mine.constructor = app.game.field.mine;
    app.game.field.mine.prototype.render = function(ctx) {
        app.game.field.tile.prototype.render.call(this, ctx);
        console.log("*");
    };

    app.game.field.numbertile = function(number) {
        this._n = number;
    };
    app.game.field.numbertile.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.numbertile.constructor = app.game.field.numbertile;
    app.game.field.numbertile.prototype.render = function(ctx) {
        app.game.field.tile.prototype.render.call(this, ctx);
        if (this._n > 0) {
            console.log(this._n);
        }
    };

    return app;
})(app || {});
