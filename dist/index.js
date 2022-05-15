"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStaticModules = exports.createPluginModule = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const read_static_modules_1 = require("./read-static-modules");
const ast_1 = require("./util/ast");
const ast_types_1 = require("ast-types");
const recast_1 = require("recast");
const nt = recast_1.types.namedTypes;
async function createPluginModule(authPath) {
    const modules = (0, read_static_modules_1.readStaticModules)(path_1.default.join(__dirname, 'static'), authPath);
    return modules;
}
exports.createPluginModule = createPluginModule;
function updateStaticModules(staticModules, appModule, srcDir, authDir) {
    const authModulePath = path_1.default.join(authDir, 'auth.module.ts');
    const authModule = staticModules.find(module => module.path === authModulePath);
    if (authModule === undefined) {
        throw new TypeError('AuthModule does not exist.');
    }
    const basicStrategyIdentifier = ast_types_1.builders.identifier(`BasicStrategy`);
    const basicStrategyImport = (0, ast_1.importNames)([basicStrategyIdentifier], `./basic/basic.strategy`);
    const imports = [
        basicStrategyImport
    ];
    const authModuleFile = (0, ast_1.parse)(authModule?.code);
    (0, ast_1.addImports)(authModuleFile, imports);
    (0, ast_1.pushIdentifierToModuleSection)(authModuleFile, "providers", basicStrategyIdentifier);
    authModule.code = (0, recast_1.print)(authModuleFile).code;
    // const appModulePath = path.join(srcDir, 'app.module.ts');
    // const appModule = staticModules.find(module => module.path === appModulePath);
    if (appModule === undefined) {
        throw new TypeError('AppModule does not exist.');
    }
    const appModuleFile = (0, ast_1.parse)(appModule?.code);
    const basicStrategyImportFromAuthModule = (0, ast_1.importNames)([basicStrategyIdentifier], `./auth/auth.module`);
    const appModuleImports = [
        basicStrategyImportFromAuthModule
    ];
    (0, ast_1.addImports)(appModuleFile, appModuleImports);
    (0, ast_1.pushIdentifierToModuleSection)(appModuleFile, "imports", basicStrategyIdentifier);
    appModule.code = (0, recast_1.print)(appModuleFile).code;
}
exports.updateStaticModules = updateStaticModules;
