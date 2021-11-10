
import * as path from 'path';

import { DiffUtils } from './utils';

class DiffConfig {
    threshold?: number
}


export class Diff {
    left: Buffer;
    right: Buffer;
    config: DiffConfig;

    constructor(left: Buffer, right: Buffer, config?: DiffConfig) {
        this.left = left;
        this.right = right;
        this.config = config;
    }

    async compare(): Promise<boolean | {ndiff: number, diff?: Buffer}[]> {
        // #1: Check if buffer equals
        if(this.left.compare(this.right) === 0) {
            return true;
        }

        // #2: Else, convert the PDF to PNG
        let leftPngs = await DiffUtils.pdfToPngs(this.left);
        let rightPngs = await DiffUtils.pdfToPngs(this.right);

        // #2.1: same number of pages
        if (leftPngs.length != rightPngs.length) {
            return false;
        }

        let res = []
        for (let index = 0; index < leftPngs.length; index++) {
            res.push(await DiffUtils.diffPng(leftPngs[index], rightPngs[index], {threshold: this.config.threshold}));
		}
        return res;
    }
}