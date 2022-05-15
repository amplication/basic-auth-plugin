"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filePathToModulePath = exports.relativeImportPath = exports.formatJson = exports.formatCode = exports.readFile = exports.readCode = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const lodash_1 = require("lodash");
const prettier = tslib_1.__importStar(require("prettier"));
const normalize_path_1 = tslib_1.__importDefault(require("normalize-path"));
const ast_1 = require("./ast");
const JSON_EXT = ".json";
exports.readCode = (0, lodash_1.memoize)((path) => {
    return fs.promises.readFile(path, "utf-8");
});
const readFile = async (path) => {
    const code = await (0, exports.readCode)(path);
    return (0, ast_1.parse)(code);
};
exports.readFile = readFile;
const formatCode = (code) => {
    return prettier.format(code, { parser: "typescript" });
};
exports.formatCode = formatCode;
const formatJson = (code) => {
    return prettier.format(code, { parser: "json" });
};
exports.formatJson = formatJson;
/**
 * @param from filePath of the module to import from
 * @param to filePath of the module to import to
 */
function relativeImportPath(from, to) {
    const relativePath = path.relative(path.dirname(from), to);
    return filePathToModulePath(relativePath);
}
exports.relativeImportPath = relativeImportPath;
/**
 * @param filePath path to the file to import
 * @returns module path of the given file path
 */
function filePathToModulePath(filePath) {
    const parsedPath = path.parse(filePath);
    const fixedExtPath = parsedPath.ext === JSON_EXT
        ? filePath
        : path.join(parsedPath.dir, parsedPath.name);
    const normalizedPath = (0, normalize_path_1.default)(fixedExtPath);
    return normalizedPath.startsWith("/") || normalizedPath.startsWith(".")
        ? normalizedPath
        : "./" + normalizedPath;
}
exports.filePathToModulePath = filePathToModulePath;
