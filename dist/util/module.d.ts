/// <reference types="lodash" />
import { namedTypes } from "ast-types";
export declare type Variables = {
    [variable: string]: string | null | undefined;
};
export declare const readCode: ((path: string) => Promise<string>) & import("lodash").MemoizedFunction;
declare const readFile: (path: string) => Promise<namedTypes.File>;
export { readFile };
export declare const formatCode: (code: string) => string;
export declare const formatJson: (code: string) => string;
/**
 * @param from filePath of the module to import from
 * @param to filePath of the module to import to
 */
export declare function relativeImportPath(from: string, to: string): string;
/**
 * @param filePath path to the file to import
 * @returns module path of the given file path
 */
export declare function filePathToModulePath(filePath: string): string;
