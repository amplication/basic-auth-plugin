import { Module } from "./types/module";
/**
 * Reads files from given source directory and maps them to module objects with
 * path relative to given basePath
 * @param source source directory to read files from
 * @param basePath path to base the created modules path on
 * @returns array of modules
 */
export declare function readStaticModules(source: string, basePath: string): Promise<Module[]>;
