module.exports =
  routes:
    index: (req, res) ->
      res.render res.locals.app.views.layout, {}
