var app = (function(app) {

    // Game constructor
    app.game = function( level) {
        this._level = level || this.level.SMALL;
        this._field = new app.game.field(level[0], level[1]);

        this._field.render();
    };

    app.game.level = {
        SMALL: [10, 5],
        MEDIUM: [20, 10],
        LARGE: [30, 20],
    };

    return app;
})(app || {});