var app = (function(app) {

    var SHORT_THRESHOLD = 300;

    // Game constructor
    app.game = function(container, level) {
        this._level = level || this.level.SMALL;
        this._info = container.querySelector('.info');
        this._canvas = _createGameCanvas.call(this, container);
        this._field = new app.game.field(this._canvas, level[0], level[1], level[2]);

        this._canvas.addEventListener('mousedown', this._down.bind(this));
        this._canvas.addEventListener('mouseup', this._up.bind(this, false));

        this._running = false;

        this._clicked = 0;
        this._marks = 0;

        this.highscores = new app.game.highscores(document.querySelector('section.highscores'));

        this._ctx = this._canvas.getContext('2d');

        _requestNotifications();

        this.render();
    };

    function _createGameCanvas(container) {
        var header = document.querySelector('header');
        var footer = document.querySelector('footer');

        var canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
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
    }

    function _requestNotifications() {
        if ("Notification" in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    app.game.prototype.render = function() {
        this._info.querySelector('.mines > .sum').innerText = this._field._mines;
        this._info.querySelector('.mines > .found').innerText = this._marks;
        this._field.render(this._ctx);
    };

    app.game.prototype.start = function() {
        if (!this._running) {

            this._time = new Date();
            this._interval = setInterval(this._timeCounter.bind(this), 1000);
            this._running = true;
        }
    };

    app.game.prototype.save = function() {
        var serialized = {
            time: new Date() - this._time,
            field: this._field.serialize(),
            marks: this._marks,
        };
        localStorage.setItem('game', JSON.stringify(serialized));
        new Notification('Game saved');
    };

    app.game.prototype.load = function() {
        if (this.stop()) {
            var saved = localStorage.getItem('game');
            if (saved !== null) {
                saved = JSON.parse(saved);
                this._time = new Date() - saved.time;
                this._marks = saved.marks;
                this._field.load(saved.field);
                this.start();

                this.render();
            }
        }
    };

    app.game.prototype.new = function(level) {
        if (this.stop()) {
            this._field = new app.game.field(this._canvas, level[0], level[1], level[2]);
            this._marks = 0;
            this._running = false;
            this.start();
            this.render();
        }
    };

    app.game.prototype.stop = function() {
        if (!this._running) {
            return true;
        } else {
            return confirm('Are you sure want to stop the current game?');
        }
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
        new Audio('sounds/explosion.wav').play();
        this.render();
        clearInterval(this._interval);
    };

    app.game.prototype._down = function(e) {
        console.log("down");
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

            this.highscores.addNew(name, this._level[2], time);
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