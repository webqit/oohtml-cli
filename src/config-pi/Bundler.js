
/**
 * imports
 */
import { _merge } from '@webqit/util/obj/index.js';
import { Dotfile } from '@webqit/backpack';

export default class Bundler extends Dotfile {

    // Base name
    get name() {
        return 'bundler';
    }

    // @desc
    static get ['@desc']() {
        return 'Bundler config.';
    }

    // Defaults merger
    withDefaults(config) {
        return _merge({
            entry_dir: './',
            output_dir: './',
            filename: './bundle.html',
            plugins: [],
            // ---------
            // Advanced
            // ---------
            module_inherits: '',
            module_extends: '',
            module_src_mode: 'eager',
            public_base_url: '/',
            max_data_url_size: 1024,
            ignore_folders_by_prefix: ['.'],
            create_outline_file: 'create',
            // ---------
            // OOHTML-related
            // ---------
            export_id_attr: 'exportid',
        }, config);
    }

    // Questions generator
    getSchema(config, choices = {}) {
        // Params
        const DATA = config;

        // Choices hash...
        const CHOICES = _merge({
            module_src_mode: [
                {value: 'eager', title: 'Eager'},
                {value: 'lazy', title: 'Lazy'},
            ],
            create_outline_file: [
                {value: '', title: 'No outline'},
                {value: 'create', title: 'Create'},
                {value: 'create_merge', title: 'Create and merge'},
            ],
        }, choices);

        // Questions
        return [
            {
                name: 'entry_dir',
                type: 'text',
                message: '[entry_dir]: Enter the entry directory (absolute or relative to Current Working Directory.)',
                initial: DATA.entry_dir,
                validation: ['important'],
            },
            {
                name: 'output_dir',
                type: 'text',
                message: '[output_dir]: Enter the output directory (absolute or relative to Current Working Directory.)',
                initial: DATA.output_dir,
                validation: ['important'],
            },
            {
                name: 'filename',
                type: 'text',
                message: '[filename]: Enter the output file name (absolute or relative to output_dir.)',
                initial: DATA.filename,
                validation: ['important'],
            },
            {
                name: 'plugins',
                type: 'recursive',
                initial: DATA.plugins,
                controls: {
                    name: 'plugin',
                    message: '[plugins]: Configure plugins?',
                },
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        message: '[name]: Enter plugin name',
                        validation: ['important'],
                    },
                    {
                        name: 'args',
                        type: 'recursive',
                        controls: {
                            name: 'argument/flag',
                            message: '[args]: Enter plugin arguments/flags',
                            combomode: true,
                        },
                        schema: [
                            {
                                name: 'name',
                                type: 'text',
                                message: '[name]: Enter argument/flag name',
                                validation: ['important'],
                            },
                            {
                                name: 'value',
                                type: 'text',
                                message: '[value]: Enter argument/flag value',
                                validation: ['important'],
                            },
                        ]
                    },
                ]
            },
            // ---------
            // Advanced
            // ---------
            {
                name: '__advanced',
                type: 'toggle',
                message: 'Show advanced options?',
                active: 'YES',
                inactive: 'NO',
                initial: DATA.__advanced,
            },
            {
                name: 'module_inherits',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: '[module_inherits]: Space-separated list of export IDs that this module inherits',
                initial: DATA.module_inherits,
            },
            {
                name: 'module_extends',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: '[module_extends]: A module ID that this module extends',
                initial: DATA.module_extends,
            },
            {
                name: 'module_src_mode',
                type: (prev, answers) => answers.__advanced ? 'select' : null,
                message: '[module_src_mode]: Choose the loading mode for submodules with remote content',
                choices: CHOICES.module_src_mode,
                initial: this.indexOfInitial(CHOICES.module_src_mode, DATA.module_src_mode),
            },
            {
                name: 'public_base_url',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: '[public_base_url]: Enter the base-URL for public resource URLs',
                initial: DATA.public_base_url,
                validation: ['important'],
            },
            {
                name: 'max_data_url_size',
                type: (prev, answers) => answers.__advanced ? 'number' : null,
                message: '[max_data_url_size]: Enter the data-URL threshold for media files',
                initial: DATA.max_data_url_size,
                validation: ['important'],
            },
            {
                name: 'ignore_folders_by_prefix',
                type: (prev, answers) => answers.__advanced ? 'list' : null,
                message: '[ignore_folders_by_prefix]: List folders to ignore by prefix (comma-separated)',
                initial: (DATA.ignore_folders_by_prefix || []).join(', '),
            },
            {
                name: 'create_outline_file',
                type: (prev, answers) => answers.__advanced ? 'select' : null,
                message: '[create_outline_file]: Choose whether to create an outline file',
                choices: CHOICES.create_outline_file,
                initial: this.indexOfInitial(CHOICES.create_outline_file, DATA.create_outline_file),
            },
            // ---------
            // OOHTML-related
            // ---------
            {
                name: '__advanced_oohtml',
                type: 'toggle',
                message: 'Show OOHTML-related options?',
                active: 'YES',
                inactive: 'NO',
                initial: DATA.__advanced,
            },
            {
                name: 'export_id_attr',
                type: (prev, answers) => answers.__advanced_oohtml ? 'text' : null,
                message: '[export_id_attr]: Enter the export element\'s "name" attribute (e.g: name)',
                initial: DATA.export_id_attr,
                validation: ['important'],
            },
        ];
    }
}
