app = (function(app) {
    app.game.highscores = function(container) {
        this._scores = [];
        this._container = container;
        this._overlay = document.createElement('div');
        this._overlay.classList.add('overlay');
        document.body.appendChild(this._overlay);

        this._container.querySelector('a[href="#close"]').addEventListener('click', this.close.bind(this));

        var saved = localStorage.getItem('game.highscores');
        if (saved !== null) {
            this._scores = JSON.parse(saved);
        }

        var table = container.querySelector('table');
        for (var i = 0; i < this._scores.length; i++) {
            var tr = _createRow(this._scores[i]);

            table.appendChild(tr);
        }
    };

    function _createRow(data) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.innerText = data.name;
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerText = data.level;
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerText = data.time;
        tr.appendChild(td);

        return tr;
    }

    app.game.highscores.prototype.addNew = function(name, level, time) {
        this._newScore = {
            name: name,
            level: level,
            time: time
        };
        console.log(this._newScore);
    };

    app.game.highscores.prototype.open = function() {
        this._container.classList.remove('hidden');
        this._overlay.classList.add('show');
        var callback = (function() {
            this._sort();
            this._container.removeEventListener('transitionend', callback);
        }).bind(this);
        this._container.addEventListener('transitionend', callback, false);
        setTimeout((function() {
            this._container.classList.add('opening');
        }).bind(this), 0);
    };

    app.game.highscores.prototype.close = function(e) {
        e.preventDefault();
        this._overlay.classList.remove('show');
        this._container.classList.remove('opening');
        var callback = function(e) {
            this.removeEventListener('transitionend', callback);
            router.redirect('root');
        };
        this._container.addEventListener('transitionend', callback);
    };

    app.game.highscores.prototype._sort = function() {
        console.log(this._newScore);
        if (this._newScore) {
            for (var index = 0; index < this._scores.length && this._newScore.time > this._scores[index].time; index++) ;

            var selector = 'table tr:nth-child(' + (index+1) + ')';
            var nextRow = this._container.querySelector(selector);

            var tr = _createRow(this._newScore);
            tr.classList.add('new');
            var table = this._container.querySelector('table');
            if (nextRow) {
                table.insertBefore(tr, nextRow);
            } else {
                table.appendChild(tr);
            }
            this._scores.splice(index, 0, this._newScore);
            localStorage.setItem('game.highscores', JSON.stringify(this._scores));
            this._newScore = undefined;
            setTimeout(function() {
                tr.classList.remove('new');
            }, 0);
        }
    };

    return app;
})(app || {game: {}});