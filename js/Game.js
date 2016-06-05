var app = (function(app) {

    // Game constructor
    app.game = function(container, level) {
        this._level = level || this.level.SMALL;
        this._canvas = _createGameCanvas.call(this, container);
        this._field = new app.game.field(this._canvas.width, this._canvas.height, level[0], level[1]);

        this._field.render(this._canvas.getContext('2d'));
    };

    function _createGameCanvas(container) {
        var header = document.querySelector('header');
        var footer = document.querySelector('footer');

        var canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        console.log(document.body.clientHeight, header.clientHeight, footer.clientHeight);
        canvas.height = document.body.clientHeight - header.clientHeight - footer.clientHeight;
        container.style.height = canvas.height + "px";

        var self = this;
        canvas.addEventListener('click', this._click.bind(this));
        container.appendChild(canvas);
        return canvas;
    };

    app.game.prototype._click = function(e) {
        var bound = e.target.getBoundingClientRect();
        var tile = this._field.getUnderCursor(e.clientX-bound.left, e.clientY-bound.top);
        if (tile !== undefined) {
            if (tile instanceof app.game.field.mine) {
                alert("Game over man!");
            } else {
                tile.click(false, this._field);
            }

            this._field.render(this._canvas.getContext('2d'));
        }

    };

    app.game.level = {
        SMALL: [10, 5],
        MEDIUM: [20, 10],
        LARGE: [30, 20],
    };

    return app;
})(app || {});