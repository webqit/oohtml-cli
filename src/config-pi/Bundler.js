
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
            entry_dir: './public',
            output_dir: './public',
            filename: './app.html',
            plugins: [],
            // ---------
            // Advanced
            // ---------
            module_inherits: '',
            module_extends: '',
            remote_module_loading: 'eager',
            remote_module_ssr: true,
            public_base_url: '/',
            max_data_url_size: 1024,
            ignore_folders_by_prefix: ['.'],
            create_outline_file: false,
            // ---------
            // OOHTML-related
            // ---------
            module_def_attr: 'def',
            fragment_def_attr: 'def',
        }, config);
    }

    // Questions generator
    getSchema(config, choices = {}) {
        // Params
        const DATA = config;

        // Choices hash...
        const CHOICES = _merge({
            remote_module_loading: [
                {value: 'eager', title: 'Eager'},
                {value: 'lazy', title: 'Lazy'},
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
                name: 'remote_module_loading',
                type: (prev, answers) => answers.__advanced ? 'select' : null,
                message: '[remote_module_loading]: Choose how to load remote modules',
                choices: CHOICES.remote_module_loading,
                initial: this.indexOfInitial(CHOICES.remote_module_loading, DATA.remote_module_loading),
            },
            {
                name: 'remote_module_ssr',
                type: (prev, answers) => answers.__advanced ? 'toggle' : null,
                message: '[remote_module_ssr]: Choose whether to add the "SSR" boolean attribute to remote modules',
                active: 'YES',
                inactive: 'NO',
                initial: DATA.remote_module_ssr,
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
                type: (prev, answers) => answers.__advanced ? 'toggle' : null,
                message: '[create_outline_file]: Choose whether to create an outline file',
                active: 'YES',
                inactive: 'NO',
                initial: DATA.create_outline_file,
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
                name: 'module_def_attr',
                type: (prev, answers) => answers.__advanced_oohtml ? 'text' : null,
                message: '[module_def_attr]: Enter the template element\'s "Module Def" attribute. (Default: def)',
                initial: DATA.module_def_attr,
                validation: ['important'],
            },
            {
                name: 'fragment_def_attr',
                type: (prev, answers) => answers.__advanced_oohtml ? 'text' : null,
                message: '[fragment_def_attr]: Enter the template element\'s "Fragment Def" attribute. (Default: def)',
                initial: DATA.fragment_def_attr,
                validation: ['important'],
            },
        ];
    }
}
