app = (function(app) {
    app.game.highscores = function(container) {
        this._scores = [];
        this._container = container;
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
        var callback = (function(e) {
            console.log("transitioned");
            this._sort();
            this._container.removeEventListener('transitionend', callback);
        }).bind(this);
        this._container.addEventListener('transitionend', callback, false);
        setTimeout((function() {
            this._container.classList.add('opening');
        }).bind(this), 0);
    };

    app.game.highscores.prototype.close = function(callback) {

    };

    app.game.highscores.prototype._sort = function() {
        console.log(this._newScore);
        if (this._newScore) {
            var index = 0;
            console.log(this._scores, this._newScore);
            for (index = 0; index < this._scores.length && this._newScore.time > this._scores[index].time; index++) ;

            console.log(this._scores);
            console.log(index);
            console.log(this._newScore.time);
            var selector = 'table tr:nth-child(' + (index+1) + ')';
            console.log(selector);
            var nextRow = this._container.querySelector(selector);
            console.log(nextRow);

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