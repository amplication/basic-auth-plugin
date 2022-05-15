"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readStaticModules = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const normalize_path_1 = tslib_1.__importDefault(require("normalize-path"));
const fast_glob_1 = tslib_1.__importDefault(require("fast-glob"));
/**
 * Reads files from given source directory and maps them to module objects with
 * path relative to given basePath
 * @param source source directory to read files from
 * @param basePath path to base the created modules path on
 * @returns array of modules
 */
async function readStaticModules(source, basePath) {
    const directory = `${(0, normalize_path_1.default)(source)}/`;
    const staticModules = await (0, fast_glob_1.default)(`${directory}**/*`, {
        absolute: false,
        dot: true,
        ignore: ["**.js", "**.js.map", "**.d.ts", "**/node_modules/**"],
    });
    return Promise.all(staticModules.sort().map(async (module) => ({
        path: module.replace(directory, basePath ? basePath + "/" : ""),
        code: await fs.promises.readFile(module, "utf-8"),
    })));
}
exports.readStaticModules = readStaticModules;
