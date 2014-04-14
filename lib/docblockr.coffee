DocblockrView = require './docblockr-view'

module.exports =
  configDefaults:
    nikhil: true

  docblockrView: null

  activate: (state) ->
    @docblockrView = new DocblockrView(state.docblockrViewState)

  deactivate: ->
    @docblockrView.destroy()

  serialize: ->
    docblockrViewState: @docblockrView.serialize()
