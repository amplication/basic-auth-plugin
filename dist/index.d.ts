import { Module } from "./types/module";
export declare function createPluginModule(authPath: string): Promise<Module[]>;
export declare function updateStaticModules(staticModules: Module[], appModule: Module, srcDir: string, authDir: string): void;
