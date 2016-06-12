app = (function(app) {

    /**
     * Třída starající se o správu výsledků
     *
     * @param container Kontejner, kde mají být výsledky zobrazené
     */
    app.game.highscores = function(container) {
        this._scores = [];
        this._container = container;

        // Černý překryv, který znemožňuje interagovat se stránkou, pokud jsou výsledky
        // aktuálně zobrazené
        this._overlay = document.createElement('div');
        this._overlay.classList.add('overlay');
        document.body.appendChild(this._overlay);

        // Tlačítko pro zavření okna s výsledky
        this._container.querySelector('a[href="#close"]').addEventListener('click', this.close.bind(this));

        // Načtení uložených výsledků z LocalStorage
        var saved = localStorage.getItem('game.highscores');
        if (saved !== null) {
            this._scores = JSON.parse(saved);
        }

        // Zobrazení výsledků do tabulky
        var table = container.querySelector('table');
        for (var i = 0; i < this._scores.length; i++) {
            var tr = _createRow(this._scores[i]);

            table.appendChild(tr);
        }
    };

    // Vytvoří jednotný řádek tabulky s výsledky
    function _createRow(data) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.innerText = data.name;
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerText = data.level + " mines";
        tr.appendChild(td);

        td = document.createElement('td');
        td.innerText = _formatTime(data.time);
        tr.appendChild(td);

        return tr;
    }

    // Naformátuje čas z počtu milisekund do formátu: [??min] ??s
    function _formatTime(time) {
        time = parseInt(time/1000);
        var minutes = parseInt(time/60);
        var seconds = parseInt(time - minutes*60);

        return ((minutes > 0) ? minutes + "min " : "") + seconds + "s";
    }

    // Uloží nový záznam výsledku k pozdějšímu zobrazení
    app.game.highscores.prototype.addNew = function(name, level, time) {
        this._newScore = {
            name: name,
            level: level,
            time: time
        };
    };

    // Otevře okno s výsledky a poté zobrazí nejnovější
    app.game.highscores.prototype.open = function() {
        this._overlay.classList.add('show');

        // Po dokončení CSS animace
        var callback = (function() {
            this._sort();
            this._container.removeEventListener('transitionend', callback);
        }).bind(this);

        this._container.addEventListener('transitionend', callback, false);

        // Přidá třídu až po vykreslení elementu prohlížečem, aby se vykonala animace
        setTimeout((function() {
            this._container.classList.add('opening');
        }).bind(this), 0);
    };

    app.game.highscores.prototype.isOpen = function() {
        return this._container.classList.contains('opening');
    };

    // Zavře okno s výsledky
    app.game.highscores.prototype.close = function(e) {
        e && e.preventDefault();
        this._overlay.classList.remove('show');
        this._container.classList.remove('opening');

        // Po uplynutí animace přesměruje do výchozího stavu
        var callback = function(e) {
            this.removeEventListener('transitionend', callback);
            router.redirect('root');
        };
        this._container.addEventListener('transitionend', callback);
    };

    // Zařadí nový záznam na správné místo s výsledky a uloží novou tabulku
    // do LocalStorage
    app.game.highscores.prototype._sort = function() {
        if (this._newScore) {
            // Nalezne správné místo pro vložení
            for (var index = 0; index < this._scores.length && this._newScore.time > this._scores[index].time; index++) ;

            // a odpovídající řádek tabulky
            var selector = 'table tr:nth-child(' + (index+1) + ')';
            var nextRow = this._container.querySelector(selector);

            // Vytvoření jednotného řádku
            var tr = _createRow(this._newScore);
            // Nový záznam je označen pro lepší orientaci
            tr.classList.add('new');
            var table = this._container.querySelector('table');
            if (nextRow) {
                table.insertBefore(tr, nextRow);
            } else {
                table.appendChild(tr);
            }

            // Vložení na správné místo v datech
            this._scores.splice(index, 0, this._newScore);
            localStorage.setItem('game.highscores', JSON.stringify(this._scores));
            this._newScore = undefined;

            // Animace označení nového výsledku
            setTimeout(function() {
                tr.classList.remove('new');
            }, 0);
        }
    };

    return app;
})(app || {game: {}});