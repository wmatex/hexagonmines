var app = (function(app) {

    var SHORT_THRESHOLD = 300;

    // Game constructor
    app.game = function(container, level) {
        this._level = level || this.level.SMALL;
        this._info = container.querySelector('.info');
        this._canvas = _createGameCanvas.call(this, container);
        this._field = new app.game.field(this._canvas.width, this._canvas.height, level[0], level[1], level[2]);

        this._running = false;

        this._clicked = 0;
        this._marks = 0;

        this.highscores = new app.game.highscores(document.querySelector('section.highscores'));

        this._ctx = this._canvas.getContext('2d');

        this.render();
    };

    function _createGameCanvas(container) {
        var header = document.querySelector('header');
        var footer = document.querySelector('footer');

        var canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        var padding = parseInt(getComputedStyle(document.body).paddingTop) + parseInt(getComputedStyle(document.body).paddingBottom);
        canvas.height = container.clientHeight - this._info.clientHeight;
        canvas.oncontextmenu = "javascript:void(0);";
        container.style.height = canvas.height + "px";

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
    };

    app.game.prototype.render = function() {
        this._info.querySelector('.mines > .sum').innerText = this._field._mines;
        this._info.querySelector('.mines > .found').innerText = this._marks;
        this._field.render(this._ctx);
    };

    app.game.prototype.start = function() {
        this._canvas.addEventListener('mousedown', this._down.bind(this));
        this._canvas.addEventListener('mouseup', this._up.bind(this, false));

        this._time = new Date();
        this._interval = setInterval(this._timeCounter.bind(this), 1000);
        this._running = true;
    };

    app.game.prototype.save = function() {
        var serialized = {
            time: new Date() - this._time,
            field: this._field.serialize(),
            marks: this._marks,
        };
        localStorage.setItem('game', JSON.stringify(serialized));
    };

    app.game.prototype.load = function() {
        var saved = localStorage.getItem('game');
        if (saved !== null) {
            saved = JSON.parse(saved);
            this._time = new Date() - saved.time;
            this._marks = saved.marks;
            this._field.load(saved.field);

            this.render();
        }
    };

    app.game.prototype.new = function(level) {
        if (this.stop()) {
            this._field = new app.game.field(this._canvas.width, this._canvas.height, level[0], level[1], level[2]);
            this._marks = 0;
            this._time = new Date();
            this.start();
            this.render();
        }
    };

    app.game.prototype.stop = function() {
        return true;
    };

    app.game.prototype._timeCounter = function() {
        var diff = new Date() - this._time;

        diff = parseInt(diff / 1000);
        var minutes = parseInt(diff/60);
        var seconds = diff - minutes*60;
        this._info.querySelector('.time > .counter').innerText = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    };

    app.game.prototype._gameOver = function() {
        this._running = false;
        this._field.markMines();
        this._canvas.classList.add('gameover');
        this.render();
        clearInterval(this._interval);
        alert("Game over!");
    };

    app.game.prototype._down = function(e) {
        e.preventDefault();
        if (!this._running) {
            return;
        }
        this._clicked = new Date();
        this._clickedTimeout = setTimeout(this._up.bind(this, true, e), SHORT_THRESHOLD);
    };

    app.game.prototype._up = function(timeout, e) {
        if (!this._running) {
            return;
        }

        clearTimeout(this._clickedTimeout);
        var diff = new Date() - this._clicked;
        var bound = e.target.getBoundingClientRect();
        var tile = this._field.getUnderCursor(e.clientX-bound.left, e.clientY-bound.top);
        if (tile !== undefined) {
            // Long click
            if (timeout || diff > SHORT_THRESHOLD) {
                try {
                    tile.click(false, this._field);
                } catch (e) {
                    this._gameOver();
                }
            } else {
                if (tile.markToggle()) {
                    if (tile._marked) {
                        this._marks++;
                    } else {
                        this._marks--;
                    }
                }
            }

            this.render();

            this._checkWinner();
        }
    };

    app.game.prototype._checkWinner = function() {
        var marks = this._field.checkMarks();

        if (marks == this._field._mines) {
            var time = new Date() - this._time;
            this._running = false;
            clearInterval(this._interval);
            var name = prompt("Enter your name", "guest");

            this.highscores.addNew(name, this._level, time);
            router.redirect('highscores');
        }
    };

    app.game.level = {
        SMALL: [10, 5, 10],
        MEDIUM: [20, 10, 30],
        LARGE: [30, 20, 150],
    };

    return app;
})(app || {});