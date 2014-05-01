var DocblockrWorker = require ('./docblockr-worker.js');

module.exports = {
    configDefaults: {
        deep_indent: true,
        extend_double_slash: true,
        indentation_spaces: 1,
        indentation_spaces_same_para: 1,
        // 'no', 'shallow', 'deep'
        align_tags: 'deep',
        extra_tags: [],
        extra_tags_go_after: false,
        notation_map: [],
        return_tag: '@return',
        return_description: true,
        param_description: true,
        spacer_between_sections: false,
        per_section_indent: false,
        min_spaces_between_columns: 1,
        auto_add_method_tag: false,
        simple_mode: false,
        lower_case_primitives: false,
        short_primitives: false,
        override_js_var: false,
        newline_after_block: false,
        development_mode: false
    },
    
    activate: function() {
        return (this.Docblockr = new DocblockrWorker());
    }
};