import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

it('keeps production feature imports and re-exports free of feature cycles', () => {
  const root = resolve(__dirname, '../../features');
  const graph = new Map();
  const files = readdirSync(root, { recursive: true }).map(String)
    .filter((file) => /\.[jt]sx?$/.test(file) && !file.split(sep).includes('__tests__'));
  for (const file of files) {
    const owner = file.split(sep)[0];
    if (!graph.has(owner)) graph.set(owner, new Set());
    const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier)) continue;
      const name = specifier.text;
      const target = name.startsWith('@/features/')
        ? name.slice('@/features/'.length).split('/')[0]
        : name.startsWith('.')
          ? relative(root, resolve(root, dirname(file), name)).split(sep)[0]
          : undefined;
      if (target && target !== '..' && target !== owner) graph.get(owner).add(target);
    }
  }
  const cycles = new Set();
  const visited = new Set();
  const visit = (owner, path) => {
    if (path.includes(owner)) {
      cycles.add([...path.slice(path.indexOf(owner)), owner].join(' → '));
      return;
    }
    if (visited.has(owner)) return;
    for (const target of graph.get(owner) ?? []) visit(target, [...path, owner]);
    visited.add(owner);
  };
  for (const owner of graph.keys()) visit(owner, []);
  expect([...cycles]).toEqual([]);
});
