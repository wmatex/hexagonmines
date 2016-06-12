var app = (function(app) {

    // Maximální čas krátného kliknutí
    var SHORT_THRESHOLD = 300; //ms

    /**
     * Třída pro veškerou herní logiku
     */
    app.game = function(container, level) {
        this._level = level || this.level.SMALL;
        this._info = container.querySelector('.info');

        // Vytvoření canvasu pro vykreslení celé hry
        this._canvas = _createGameCanvas.call(this, container);

        // Vytvoření herního pole s minami
        this._field = new app.game.field(this._canvas, level[0], level[1], level[2]);

        this._canvas.addEventListener('mousedown', this._down.bind(this));
        this._canvas.addEventListener('mouseup', this._up.bind(this, false));

        this._running = false;

        // Pomocná proměnná pro krátké/dlouhé kliknutí
        this._clicked = 0;

        // Počet vlaječek
        this._marks = 0;

        // Nejlepší skóre
        this.highscores = new app.game.highscores(document.querySelector('section.highscores'));

        this._ctx = this._canvas.getContext('2d');

        _requestNotifications();

        // Vykreslení celé hry včetně herního pole
        this.render();
    };

    function _createGameCanvas(container) {
        var header = document.querySelector('header');
        var footer = document.querySelector('footer');

        var canvas = document.createElement('canvas');

        // Nastavení šířky a výšky podle rodiče
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight - this._info.clientHeight;
        canvas.oncontextmenu = "javascript:void(0);";

        // Tlačítko pro celou obrazovku
        this._info.nextElementSibling.addEventListener('click', function() {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
        });

        container.insertBefore(canvas, this._info.nextElementSibling);

        return canvas;
    }

    // Notifikace pro různé herní události
    function _requestNotifications() {
        if ("Notification" in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    // Vykreslí herní info a samotné herní pole
    app.game.prototype.render = function() {
        this._info.querySelector('.mines > .sum').innerText = this._field._mines;
        this._info.querySelector('.mines > .found').innerText = this._marks;
        this._field.render(this._ctx);
    };

    // Pokud již hra neběží, tak se spustí nová
    app.game.prototype.start = function() {
        if (!this._running) {
            this._time = new Date();
            // Spuštění herního časovače
            this._interval = setInterval(this._timeCounter.bind(this), 1000);
            this._running = true;
        }
    };

    // Uložení aktuální hry do LocalStorage
    app.game.prototype.save = function() {

        // Serializace všech komponent
        var serialized = {
            time: new Date() - this._time,
            field: this._field.serialize(),
            marks: this._marks,
        };
        // LocalStorage ukládá pouze řetezce
        localStorage.setItem('game', JSON.stringify(serialized));

        // Zobrazení informace uživateli
        if ("Notification" in window) {
            new Notification('Game saved');
        }
    };

    // Načtení poslední uložené hry z LocalStorage
    app.game.prototype.load = function() {
        // Nejdříve zastavíme aktuální hru s dovolením uživatele
        if (this.stop()) {
            var saved = localStorage.getItem('game');
            if (saved !== null) {
                saved = JSON.parse(saved);

                // Deserializace všech komponent
                this._time = new Date() - saved.time;
                this._marks = saved.marks;
                this._field = new app.game.field(this._canvas, saved.field.width, saved.field.height, 0, saved.field);
                this.start();

                this.render();
            }
        }
    };

    // Vytvoření nové hry s definovanou úrovní
    app.game.prototype.new = function(level) {
        if (this.stop()) {
            this._field = new app.game.field(this._canvas, level[0], level[1], level[2]);
            this._marks = 0;
            this._running = false;
            this.start();
            this.render();
        }
    };

    // Pokud nějaká hra běží, zeptá se uživatele, jestli se může zastavit
    app.game.prototype.stop = function() {
        if (!this._running) {
            return true;
        } else {
            return confirm('Are you sure want to stop the current game?');
        }
    };

    // Aktualizuje informace o čase hry
    app.game.prototype._timeCounter = function() {
        var diff = new Date() - this._time;

        diff = parseInt(diff / 1000);
        var minutes = parseInt(diff/60);
        var seconds = diff - minutes*60;
        this._info.querySelector('.time > .counter').innerText = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    };

    // Konec hry - šlápnutí na minu
    app.game.prototype._gameOver = function() {
        this._running = false;

        // Označí všechny miny
        this._field.markMines();

        // Spustí zvuk exploze
        new Audio('sounds/explosion.wav').play();
        this.render();
        clearInterval(this._interval);
    };

    // Mousedown událost
    app.game.prototype._down = function(e) {
        e.preventDefault();
        if (!this._running) {
            return;
        }

        // Zaznamenání času kliknutí
        this._clicked = new Date();

        // Pokud nedojde v časovém limitu k zvednutí tlačítka myši provede se automaticky
        // dlouhé kliknutí
        this._clickedTimeout = setTimeout(this._up.bind(this, true, e), SHORT_THRESHOLD);
    };

    // Mouseup událost
    // @param timeout Jestli tato událost byla vygenerována automaticky po časovém limitu (true),
    //                nebo uživatelem (false)
    app.game.prototype._up = function(timeout, e) {
        if (!this._running) {
            return;
        }

        clearTimeout(this._clickedTimeout);
        var diff = new Date() - this._clicked;
        var bound = e.target.getBoundingClientRect();

        // Nalezení políčka pod ukazatelem myši
        var tile = this._field.getUnderCursor(e.clientX-bound.left, e.clientY-bound.top);
        if (tile !== undefined) {
            // Pokud se jedná o dlouhé podržení myši, pole se odkryje
            if (timeout || diff > SHORT_THRESHOLD) {
                // Pokud došlo na kliknutí miny, vyhodí se vyjímka a je konec hry
                try {
                    tile.click(false, this._field);
                } catch (e) {
                    this._gameOver();
                }
            } else {
                // Krátné kliknutí pouze označí políčko vlajkou
                if (tile.markToggle()) {
                    if (tile._marked) {
                        this._marks++;
                    } else {
                        this._marks--;
                    }
                }
            }

            this.render();

            // Kontrola, jestli jsou již všechny miny správně označeny
            this._checkWinner();
        }
    };

    // Zkontroluje správnost označení všech min
    app.game.prototype._checkWinner = function() {
        var marks = this._field.checkMarks();

        // Všechny miny jsou správně označeny => vítězství
        if (marks == this._field._mines) {
            var time = new Date() - this._time;
            this._running = false;
            clearInterval(this._interval);
            var name = prompt("Enter your name", "guest");

            this.highscores.addNew(name, this._level[2], time);

            // Přepnutí stavu s tabulku výsledků
            router.redirect('highscores');
        }
    };

    // Herní úrovně
    app.game.level = {
        SMALL: [10, 5, 10],
        MEDIUM: [20, 10, 30],
        LARGE: [30, 20, 150],
    };

    return app;
})(app || {});