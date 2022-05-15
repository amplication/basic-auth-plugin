"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptions = exports.parse = void 0;
const tslib_1 = require("tslib");
const recastBabelParser = tslib_1.__importStar(require("recast/parsers/babel"));
const _babel_options_1 = tslib_1.__importDefault(require("recast/parsers/_babel_options"));
function parse(source, options) {
    return recastBabelParser.parser.parse(source, getOptions(options));
}
exports.parse = parse;
function getOptions(options) {
    const babelOptions = (0, _babel_options_1.default)(options);
    babelOptions.plugins.push("typescript", "jsx");
    return babelOptions;
}
exports.getOptions = getOptions;
