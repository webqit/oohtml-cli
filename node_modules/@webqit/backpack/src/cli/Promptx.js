
/**
 * @imports
 */
import Path from 'path';
import { _toTitle } from '@webqit/util/str/index.js';
import { _all, _from as _arrFrom } from '@webqit/util/arr/index.js';
import { _isObject, _isArray, _isString, _isNumeric, _isFunction, _isEmpty } from '@webqit/util/js/index.js';
import Prompts from 'prompts';
import Logger from '../Logger.js';

/**
 * @Prompt-normal
 */
export default function Promptx(schema, options = {}) {

    // ------------
    // Capture recursive types
    // ------------

    schema = _arrFrom(schema, false).map(question => {
        if (question.schema) {
            // The prompt for the schema
            if (!question.controls) {
                question.controls = {}; 
            }
            Object.defineProperty(question.controls, 'src', {value: question});
            if (!question.controls.name) {
                question.controls.name = question.name;
            }
            // ----------------
            normalizeControls(question.controls);
            // ----------------
            const indentation = (typeof question.indentation === 'number' ? question.indentation : 0) + (question._indentation || 0);
            const prompt = 'CONFIGURE';//question.controls.add.active + '/' + question.controls.cta.active;
            if (!question.controls.message) {
                question.controls.message = Logger.f`${prompt} ${question.name}`;
            }
            if (!question.controls.message.startsWith(' ')) {
                question.controls.message = (' '.repeat(indentation)) + question.controls.message; 
            }
            if (_isFunction(question.type)) {
                let promptType = question.controls.type || 'toggle';
                question.controls.type = (...args) => {
                    question.controls.srcType = question.type(...args);
                    return question.controls.srcType ? promptType : null;
                };
            } else {
                question.controls.srcType = question.type;
                if (!question.controls.type) {
                    question.controls.type = 'toggle';
                }
            }
            if (!question.controls.active) {
                question.controls.active = prompt;
            }
            if (!question.controls.inactive) {
                question.controls.inactive = 'SKIP';
            }
            if (!('initial' in question.controls)) {
                question.controls.initial = !_isEmpty(question.initial);
            }        
            // Swap... 
            return question.controls;
        }
        return question;
    });

    // ------------
    // Run...
    // ------------

    return Prompts(schema, {onSubmit: async function(question, answer, answers) {
        if (question.exclude) {
            delete answers[question.name];
        } else if (question.src) {
            const actuallyControls = question;
            const actuallyQuestion = question.src;
            const subQuestions = _arrFrom(actuallyQuestion.schema, false);
            const indentation = (typeof actuallyQuestion.indentation === 'number' ? actuallyQuestion.indentation : 2) + (actuallyQuestion._indentation || 0);
            if (indentation) {
                subQuestions.forEach(_question => {
                    _question.message = (' '.repeat(indentation)) + _question.message;
                    _question._indentation = indentation;
                });
            }
            if (actuallyControls.srcType === 'recursive') {
                if (answer) {
                    answers[actuallyQuestion.name] = await Promptr(subQuestions, actuallyQuestion.initial, actuallyControls);
                }
            } else {
                var _subQuestions = subQuestions;
                if (actuallyQuestion.initial) {
                    _subQuestions = withInitials(subQuestions, actuallyQuestion.initial);
                }
                answers[actuallyQuestion.name] = answer ? (await Promptx(_subQuestions)) : {};    
            }    
        }
    }, ...options});

}

/**
 * -----------------
 * Validators
 * -----------------
 */
export async function Promptr(schema, values, controls = {}) {

    if (_isFunction(values)) {
        values = values();
    }
    // ----------------
    normalizeControls(controls);
    // ----------------    
    const keys = Object.keys(values);
    const answers = controls.combomode ? {} : [];
    const runPromts = async index => {
        var nameKey = (_isObject(controls.combomode) ? controls.combomode.name : '') || 'name';
        var valueKey = (_isObject(controls.combomode) ? controls.combomode.value : '') || 'value';
        // -------------
        var _schema = schema;
        if (controls.combomode) {
            _schema = withInitials(schema, [keys[index], values[keys[index]]]);
        } else {
            _schema = withInitials(schema, values[keys[index]] || []);
        }
        // -------------
        const subAnswers = await Promptx(_schema);
        // -------------
        // Handle prompt...
        if (_isFunction(controls.add.onSubmit)) {
            controls.add.onSubmit(answers, subAnswers, controls);
        } else if (subAnswers) {
            if (controls.combomode) {
                if (subAnswers[nameKey]) {
                    answers[subAnswers[nameKey]] = subAnswers[valueKey];
                }
            } else {
                answers.push(subAnswers);
            }
        }
        // -------------
        // Do Call-to-Action
        if (keys[index]) {
            if (subAnswers && (await Prompts(controls.cta))[controls.cta.name]) {
                if (_isFunction(controls.cta.onSubmit)) {
                    controls.cta.onSubmit(answers, subAnswers, controls);
                } else {
                    if (controls.combomode) {
                        delete answers[subAnswers[nameKey]];
                    } else {
                        answers.pop();
                    }
                }
            }
            if (keys[index + 1]) {
                await runPromts(index + 1);
            }
        }
        // -------------
        // Do Add
        if (!keys[index + 1]) {
            if (subAnswers && (await Prompts(controls.add))[controls.add.name]) {
                await runPromts(index + 1);
            }
        }
    };
    await runPromts(0);
    return answers;
}

/**
 * Normalize controls.
 */
const normalizeControls = controls => {
    const indentation = (typeof controls.src.indentation === 'number' ? controls.src.indentation : 2) + (controls.src._indentation || 0);
    // The prompt for the schema
    if (!controls.name) {
        controls.name = 'question'; 
    }
    //onRender(kleur) { this.msg = kleur.green(this.msg); },
    // ----------------
    // The "add" prompt for the schema
    if (!controls.add) {
        controls.add = {}; 
    }
    if (!controls.add.name) {
        controls.add.name = 'add';
    }
    if (!controls.add.type) {
        controls.add.type = 'toggle';
    }
    if (!controls.add.message) {
        controls.add.message = Logger.f`${_toTitle(controls.add.name)} another ${controls.name}?`;
    }
    if (!controls.add.message.startsWith(' ')) {
        controls.add.message = (' '.repeat(indentation)) + controls.add.message;
    }
    if (!controls.add.active) {
        controls.add.active = 'ADD';
    }
    if (!controls.add.inactive) {
        controls.add.inactive = 'NO';
    }
    // The "cta" prompt for the schema
    if (!controls.cta) {
        controls.cta = {}; 
    }
    controls.cta.name = 'remove';
    if (!controls.cta.type) {
        controls.cta.type = 'toggle';
    }
    if (!controls.cta.message) {
        controls.cta.message = Logger.f`${_toTitle(controls.cta.name)} this ${controls.name}?`;
    }
    if (!controls.cta.message.startsWith(' ')) {
        controls.cta.message = (' '.repeat(indentation)) + controls.cta.message; 
    }
    if (!controls.cta.active) {
        controls.cta.active = 'REMOVE';
    }
    if (!controls.cta.inactive) {
        controls.cta.inactive = 'KEEP';
    }
};

/**
 * Injects initials into schema.
 */
const withInitials = (schema, initials) => {
    return schema.map((question, i) => {
        const _question = {...question};
        if (_question.schema) {
            _question.schema = _question.schema.slice(0);
        }
        if (_question.controls) {
            _question.controls = {..._question.controls};
        }
        const  key = _isArray(initials) ? i : question.name;
        const defaultInitial = _question.initial;
        _question.initial = (...args) => {
        var _initial = (key in initials) ? initials[key] : undefined;
        if (_isFunction(defaultInitial)) {
            _initial = defaultInitial.call({ value: _initial }, ...args);
        }
        if (_question.choices) {
                return initialGetIndex(_question.choices, _initial);
        }
        if (_isArray(_initial) && (!_initial.length || _all(_initial, i => _isString(i)))) {
            return _initial.join(',');
        }
        return _initial;
        }
        return _question;
    });
};

/**
 * -----------------
 * Helpers
 * -----------------
 */
export const initialGetIndex = (choices, value, valueProp = 'value') => choices.reduce((i, choice, _i) => choice[valueProp] === value ? _i : i, 0);

/**
 * -----------------
 * Validators
 * -----------------
 */
export function validateAs(types, msgSfx = ':') {
    return val => {
        var test = true, type;
        while(test === true && (type = types.shift())) {
            test = validateAs[type](val, msgSfx);
        }
        return test;
    };
}
// Input
validateAs.input = (val, msgSfx) => true;
// number
validateAs.number = (val, msgSfx) => _isNumeric(val.trim()) ? true : 'This must be a number' + msgSfx;
// important
validateAs.important = (val, msgSfx) => val ? true : 'This is important' + msgSfx;
// confirm
validateAs.confirm = (val, msgSfx) => [true, false].includes(val) ? true : 'This must be "true" or "false' + msgSfx;

/**
 * -----------------
 * Transformers
 * -----------------
 */
export function transformAs(types) {
    return val => {
        var transformed = val, type;
        while(transformed && (type = types.shift())) {
            transformed = transformAs[type](transformed);
        }
        return transformed;
    };
}
// path
transformAs.path = val => Path.resolve(val);
// multiple
transformAs.multiple = (val, delimiter = ',') => _isArray(val) ? val : val.split(delimiter);

