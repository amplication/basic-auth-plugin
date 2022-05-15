"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptions = exports.parse = void 0;
const tslib_1 = require("tslib");
const recastBabelParser = tslib_1.__importStar(require("recast/parsers/babel"));
const parser = tslib_1.__importStar(require("./parser"));
function parse(source, options) {
    return recastBabelParser.parser.parse(source, getOptions(options));
}
exports.parse = parse;
function getOptions(options) {
    const parserOptions = parser.getOptions(options);
    parserOptions.allowAwaitOutsideFunction = true;
    parserOptions.allowReturnOutsideFunction = true;
    parserOptions.allowSuperOutsideMethod = true;
    parserOptions.allowUndeclaredExports = true;
    return parserOptions;
}
exports.getOptions = getOptions;
