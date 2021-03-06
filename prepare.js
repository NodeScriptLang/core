import glob from 'glob';
import fs from 'node:fs';
import path from 'node:path';

generateIndexes('./src/main/types');
generateIndexes('./src/main/util');
generateIndexes('./src/main/schema');
generateIndexes('./src/main/model');
generateIndexes('./src/main/nodes');
generateIndexes('./src/main/runtime');

function generateIndexes(dir) {
    dir = path.join(process.cwd(), dir);
    const files = glob
        .sync('**/*.ts', { cwd: dir })
        .sort()
        .filter(_ => !_.endsWith('index.ts'));
    const lines = files.map(f => `export * from './${f.replace(/\.ts$/i, '.js')}';\n`);
    lines.push('');
    const outFile = path.join(dir, 'index.ts');
    lines.unshift('// This file is auto-generated\n');
    fs.writeFileSync(outFile, lines.join(''));
    console.info(`Generated ${outFile}`);
}
