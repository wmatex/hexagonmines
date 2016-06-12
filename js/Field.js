var app = (function (app) {
    var X_LENGTH = 1.7320508; // sqrt(3) = šířka šestiúhelníku s jednotkovou délkou hrany
    var HEX_SIZE = null; // Délka hrany šestiúhelníku
    var MARGIN = 2; // Okraj herní plochy
    var NUMBER = 0; // Typ pole číslo
    var MINE = 1;   // Typ pole mina

    /**
     * Třída reprezentující celé hrací pole
     *
     * @param canvas HTML canvas
     * @param width  Počet polí na šířku
     * @param height Počet polí na výšku
     * @param mineCount Počet min
     */
    app.game.field = function (canvas, width, height, mineCount, serialized) {
        var canvasHeight = canvas.height - 2*MARGIN;
        var canvasWidth = canvas.width - 2*MARGIN;

        // Otočení hracího pole podle tvaru canvasu.
        // Tímto se maximálně využije plocha i na malých zařízeních
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

        // Výpočet délky hrany šestiúhelníku na základě velikosti hrací plochy a canvasu
        var x = 2*canvasWidth/(2*width + 1);
        var h1 = x/X_LENGTH;
        var h2 = 2 * canvasHeight / (3*height + 1);
        HEX_SIZE = Math.min(h1, h2);

        // Zmenšení šířky canvasu, pokud je to možné. Tím se umožní zarovnat ho na střed viewportu.
        var realWidth = width*HEX_SIZE*X_LENGTH + 0.5*HEX_SIZE*X_LENGTH +2*MARGIN;
        if (realWidth < canvasWidth) {
            canvas.width = realWidth;
            this._cW = realWidth;
        }

        this._width = width;
        this._height = height;
        this._data = [];
        this._mines = mineCount;


        if (serialized) {
            // Načtení uložených hodnot
            this.load(serialized);
        } else {
            // Vygenerování min na náhodných místech
            _generateRandomField.call(this);
        }
    };

    app.game.field.constructor = app.game.field;

    // Vrátí pole v okolí daného pole
    app.game.field.prototype.getNeighbourhood = function (y, x) {
        var neighbours = [];

        // Pomocná funkce pro extrakci polí z matice
        function pushFields(field, neigh, c) {
            for (var i = 0; i < c.length; i++) {
                if (c[i][0] >= 0 && c[i][0] < field.length && c[i][1] >= 0 && c[i][1] < field[c[i][0]].length) {
                    neigh.push(field[c[i][0]][c[i][1]]);
                }
            }
        }

        // Liché a sudé řádky se liší o posun
        if (y % 2 == 0) {
            pushFields(this._data, neighbours, [
                // Horní levá a horní
                [y - 1, x - 1], [y - 1, x],
                // Dolní levá a dolní
                [y + 1, x - 1], [y + 1, x]
            ]);
        } else {
            pushFields(this._data, neighbours, [
                // Horní a horní pravá
                [y - 1, x], [y - 1, x + 1],
                // Dolní a dolní pravá
                [y + 1, x], [y + 1, x + 1]
            ]);
        }
        pushFields(this._data, neighbours, [
            // Pravá a levá
            [y, x - 1], [y, x + 1]
        ]);

        return neighbours;
    };

    // Vygeneruje celé pole s minami na náhodných pozicích
    var _generateRandomField = function () {
        var m = 0;
        var positions = [];
        // Náhodné pozice min
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

        // Vygenerování celého herního pole
        for (var y = 0; y < this._height; y++) {
            var row = [];
            for (var x = 0; x < this._width; x++) {
                // Pokud má být mina na této pozici
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

        // Vygenerování správných čísel na základě počtu min v okolí
        var neigh = [];
        for (y = 0; y < this._height; y++) {
            for (x = 0; x < this._width; x++) {
                if (this._data[y][x] === null) {

                    // Okolí daného pole
                    neigh = this.getNeighbourhood(y, x);

                    // Počet min v okolí
                    var nMines = 0;
                    for (var i = 0; i < neigh.length; i++) {
                        if (neigh[i] instanceof app.game.field.mine) {
                            nMines++;
                        }
                    }

                    // Vytvoření pole se správným číslem
                    this._data[y][x] = new app.game.field.numbertile(y, x, nMines);
                }
            }
        }
    };

    // Označení všech min po ukončení hry
    app.game.field.prototype.markMines = function() {
      for (var y = 0; y < this._data.length; y++) {
          for (var x = 0; x < this._data[y].length; x++) {
              if (this._data[y][x] instanceof app.game.field.mine) {
                  this._data[y][x].show();
              }
          }
      }
    };

    // Vrátí pole pod kurzorem
    app.game.field.prototype.getUnderCursor = function(x, y) {
        // Přibližná pozice pole
        var yIndex = Math.floor(y/(HEX_SIZE*1.5));
        var xIndex = Math.floor(x/(X_LENGTH*HEX_SIZE)) - 1;

        for (var i = 0; i < 2; i++) {
            yIndex += i;
            for (var j = 0; j < 2; j++) {
                xIndex += j;
                if (yIndex < this._height && xIndex >= 0 && xIndex < this._width) {
                    // Pokud se kurzor opravdu nachází uvnitř pole
                    if (this._data[yIndex][xIndex].inside(x,y)) {
                        return this._data[yIndex][xIndex];
                    }
                }
            }
        }
    };

    // Vrátí počet správně označených min nebo -1 pokud je označení špatně
    app.game.field.prototype.checkMarks = function() {
        var marks = 0;
        for (var y = 0; y < this._data.length; y++) {
            for (var x = 0; x < this._data[y].length; x++) {
                // Pokud se jedná o minu a je označena zvyč počítadlo
                if (this._data[y][x]._marked && this._data[y][x] instanceof app.game.field.mine) {
                    marks++;
                // Pokud se nejedná o minu a je označena, je ozačení určitě špatně
                } else if (this._data[y][x]._marked && ! (this._data[y][x] instanceof app.game.field.mine)) {
                    return -1;
                }
            }
        }

        return marks;
    };

    // Serializace herního pole pro uložení do LocalStorage
    app.game.field.prototype.serialize = function() {
        var serialized = {
            width: this._width,
            height: this._height,
            data: []
        };

        for (var y = 0; y < this._data.length; y++) {
            for (var x = 0; x < this._data[y].length; x++) {
                var tile = this._data[y][x];
                // Uložení všech hodnot o aktuálním poli
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

    // Načtení uložených hodnot z LocalStorage zpět do objektu
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
                // Vytvoření správného pole na základě uložených dat
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

    // Vykreslení celého herního pole do canvasu
    app.game.field.prototype.render = function (ctx) {
        ctx.clearRect(0, 0, this._cW, this._cH);
        for (var y = 0; y < this._data.length; y++) {
            for (var x = 0; x < this._data[y].length; x++) {
                this._data[y][x].render(ctx);
            }
        }
    };

    // Třída reprezentující jedno herní pole
    app.game.field.tile = function (y, x) {
        this._y = y; // Y-lonová souřadnice
        this._x = x; // X-ová souřadnice

        this._clicked = false;
        this._marked = false;

        // Pole v liché řádce jsou posunuta o polovinu doprava
        var offset = this._y % 2 == 1 ? this.rel(X_LENGTH/2.0) : 0;

        // Levý horní roh šestiúhelníku
        this._origin = [offset+this._x*this.rel(X_LENGTH), this.rel(0.5) + this.rel(1.5*this._y)];

        // Body šestiúhelníku relativně k levému hornímu rohu
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

    // Test, zda bod x,y je uvnitř šestiúhelníku
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

    // Vykreslení pole do canvasu
    app.game.field.tile.prototype.render = function (ctx) {
        // Změna barvy, pokud je pole zakliknuté
        if (this._clicked) {
            ctx.fillStyle = "#cccccc";
        } else {
            ctx.fillStyle = "#eeeeee";
        }
        ctx.lineWidth = 1;

        // Posun souřadnicové soustavy do levého horního rohu pole
        ctx.translate(this._origin[0], this._origin[1]);
        ctx.beginPath();
        ctx.moveTo(this._points[0][0], this._points[0][1]);

        // Vykreslení všech bodů pole
        for (var i = 1; i < this._points.length; i++) {
            ctx.lineTo(this._points[i][0], this._points[i][1]);
        }
        ctx.closePath();

        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();

        // Pokud je pole označeno, vykresli vlajku
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

    // Vypočte správnou délku relativně k délce hrany
    app.game.field.tile.prototype.rel = function(val) {
        return val * HEX_SIZE;
    };

    // Kliknutí na pole
    app.game.field.tile.prototype.click = function(auto, field) {
        this._clicked = true;
        this._marked = false;
    };

    // Označení pole vlajkou
    app.game.field.tile.prototype.markToggle = function() {
        if (!this._clicked) {
            this._marked = !this._marked;
            return true;
        } else {
            return false;
        }
    };

    // Třída reprezentující minu
    app.game.field.mine = function (y, x) {
        app.game.field.tile.call(this, y, x);
        this._showed = false;

    };
    // "Podědění" prototypu z obecného pole
    app.game.field.mine.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.mine.constructor = app.game.field.mine;

    // Vykreslí minu do canvasu
    app.game.field.mine.prototype.render = function (ctx) {
        ctx.save();
        app.game.field.tile.prototype.render.call(this, ctx);

        // Pokud má být mina zobrazena
        if (this._showed) {
            // Označení miny, na kterou bylo kliknuto
            if (this._clicked) {
                ctx.fillStyle = 'red';
            }
            ctx.fill();

            // "Bomba s doutnákem"
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

    // Kliknutí na minu
    app.game.field.mine.prototype.click = function(auto, field) {
        if (!this._marked) {
            app.game.field.tile.prototype.click.call(this, auto, field);
            // Pokud se jedná o klik uživatele, je konec hry
            if (!auto) {
                throw "Game Over";
            }
        }
    };

    // Zobrazí minu
    app.game.field.mine.prototype.show = function() {
        this._showed = true;
    };

    // Třída reprezentující číselné pole
    app.game.field.numbertile = function (y, x, number) {
        app.game.field.tile.call(this, y, x);
        this._n = number;
    };
    app.game.field.numbertile.prototype = Object.create(app.game.field.tile.prototype);
    app.game.field.numbertile.constructor = app.game.field.numbertile;

    // Vykreslí pole do canvasu
    app.game.field.numbertile.prototype.render = function (ctx) {
        ctx.save();
        app.game.field.tile.prototype.render.call(this, ctx);

        // Pokud je pole rozkliknuto a je kolem něj nějaká mina, zobrazí počet min v okolí
        if (this._clicked && this._n > 0) {
            ctx.fillStyle = "black";
            ctx.font = HEX_SIZE + "px arial bold";

            // Vycentrování textu
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(this._n, this.rel(X_LENGTH / 2.0), this.rel(0.5));
        }

        ctx.restore();
    };

    // Kliknutí na pole
    app.game.field.numbertile.prototype.click = function(auto, field) {
        if (!this._marked) {
            app.game.field.tile.prototype.click.call(this, auto, field);

            // Pokud se jedná o prázdné pole, odkryje celou oblast
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
