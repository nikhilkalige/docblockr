{View} = require 'atom'

module.exports =
class DocblockrView extends View
  @content: ->
    @div class: 'docblockr overlay from-top', =>
      @div "The Docblockr package is Alive! It's ALIVE!", class: "message"

  initialize: (serializeState) ->
    atom.workspaceView.command "docblockr:toggle", => @toggle()

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @detach()

  toggle: ->
    console.log "DocblockrView was toggled!"
    if @hasParent()
      @detach()
    else
      atom.workspaceView.append(this)
