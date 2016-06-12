var app = (function(app) {
    /**
     * Třída starající se o přepínání stavů na základě url pomocí HistoryAPI
     *
     * @param base Base url celé aplikace
     */
    app.router = function(base) {
        this._routesByPath = {};
        this._routesByName = {};
        base = base || "/";
        if (base[0] !== '/') {
            base = '/' + base;
        }

        this._base = base;
    };

    /**
     * Přidá jeden stav. Vrací this pro jednodušší přidání více stavů
     */
    app.router.prototype.add = function(path, name, callback) {
        var route = {
            name: name,
            path: this._base + path,
            callback: callback,
        };

        // Mapy pro rychlejší přepínání a hledání
        this._routesByPath[route.path] = route;
        this._routesByName[route.name] = route;

        return this;
    };

    /**
     * Přepne stav na základě jména
     */
    app.router.prototype.redirect = function(route) {
        if (route in this._routesByName) {
            this._goto(this._routesByName[route]);
        }
    };

    /**
     * Inicializace všech posluchačů událostí
     */
    app.router.prototype.init = function() {
        var self = this;
        document.addEventListener("DOMContentLoaded", function() {
            // Přepne se od stavu daného aktualní url při refreshi stránky
            var loc = window.location.pathname;
            loc = loc.replace(/\?.*?$/, '');

            if (loc in self._routesByPath) {
                self._goto(self._routesByPath[loc]);
            }
        });

        // Přepínání stavů na základě interakce s historií prohlížeče
        window.addEventListener("popstate", function(e) {
            if (e.state && e.state.route && e.state.route in self._routesByName) {
                self._goto(self._routesByName[e.state.route]);
            }
        });
    };

    app.router.prototype.controller = function(link, action) {
        document.querySelector(link).addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof action === 'function') {
                action(e);
            }
        });
    };

    app.router.prototype._goto = function(route) {
        window.history.pushState({route: route.name}, "", route.path);
        route.callback();
    };

    return app;
})(app || {});
