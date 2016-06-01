var app = (function(app) {
    app.renderable = function() {
    };

    app.renderable.prototype.render = function(ctx) {
        throw "'renderable.render' is a pure virtual function, override it in subclass."
    };

    return app;
})(app || {});