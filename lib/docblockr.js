var DocblockrWorker = require ('./docblockr-worker.js');
var Disposable = require('atom').Disposable;

module.exports = {
    config: {
        deep_indent: {
            type: 'boolean',
            default: false
        },
        extend_double_slash: {
            type: 'boolean',
            default: true
        },
        indentation_spaces: {
            type: 'number',
            default: 1
        },
        indentation_spaces_same_para: {
            type: 'number',
            default: 1
        },
        align_tags: {
            type: 'string',
            default: 'deep',
            enum: ['no', 'shallow', 'deep']
        },
        extra_tags: {
            type: 'array',
            default: []
        },
        extra_tags_go_after: {
            type: 'boolean',
            default: false
        },
        notation_map: {
            type: 'array',
            default: []
        },
        return_tag: {
            type: 'string',
            default: '@return'
        },
        return_description: {
            type: 'boolean',
            default: true
        },
        param_description: {
            type: 'boolean',
            default: true
        },
        spacer_between_sections: {
            type: 'string',
            default: 'false',
            enum: ['true', 'false', 'after_description']
        },
        per_section_indent: {
            type: 'boolean',
            default: false
        },
        min_spaces_between_columns: {
            type: 'number',
            default: 1
        },
        auto_add_method_tag: {
            type: 'boolean',
            default: false
        },
        simple_mode: {
            type: 'boolean',
            default: false
        },
        lower_case_primitives: {
            type: 'boolean',
            default: false
        },
        short_primitives: {
            type: 'boolean',
            default: false
        },
        override_js_var: {
            type: 'boolean',
            default: false
        },
        newline_after_block: {
            type: 'boolean',
            default: false
        },
        c_style_block_comments: {
            type: 'boolean',
            default: false
        },
        development_mode: {
            type: 'boolean',
            default: false
        }
    },

    activate: function() {
        return (this.Docblockr = new DocblockrWorker());
    },

    consumeSnippetsService: function(service) {
        this.Docblockr.set_snippets_service(service);
        new Disposable(function() {
            this.Docblockr.set_snippets_service(null)
        });
    }
};
