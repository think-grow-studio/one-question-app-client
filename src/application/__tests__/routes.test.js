import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { getRoutes } from 'expo-router/build/getRoutesCore';

it('exposes only screens, never bootstrap or integration hooks, as routes', () => {
  const appRoot = resolve(__dirname, '../../app');
  const keys = readdirSync(appRoot, { recursive: true })
    .map(String)
    .filter((path) => /\.[jt]sx?$/.test(path))
    .map((path) => `./${path}`);
  const context = Object.assign(() => ({ default: () => null }), {
    keys: () => keys,
    resolve: (key) => key,
    id: 'app',
  });
  const root = getRoutes(context, { platform: 'ios' });
  const paths = (node) => [
    node.contextKey, ...node.children.flatMap(paths),
  ];
  expect(root).not.toBeNull();
  expect(paths(root).filter((path) => /\/(bootstrap|integrations)\//.test(path))).toEqual([]);
  expect(paths(root)).toContain('./(tabs)/analysis/[id].tsx');
});
