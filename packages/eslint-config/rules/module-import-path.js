import path from 'node:path';

// 앱 코드의 import 경로를 모듈 경계에 맞춘다 (docs/folder-structure.md "Path alias").
// 모듈은 src/<레이어>/<이름> 폴더이고, 같은 모듈 안은 상대 경로, 모듈 밖은 앱 별칭으로 가져온다.
// 레이어 바로 아래 파일(api/store.ts 등)은 파일 하나가 모듈이므로 ../ 를 쓸 수 없다
const toPosix = (value) => value.split(path.sep).join('/');

const isInside = (target, dir) =>
  target === dir || target.startsWith(`${dir}/`);

const toRelative = (fromDir, target) => {
  const relative = path.posix.relative(fromDir, target);
  return relative.startsWith('.') ? relative : `./${relative}`;
};

export default {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          apps: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useRelative: '같은 모듈 안은 상대 경로로 가져옵니다.',
      useAlias: '모듈 밖은 {{alias}} 별칭으로 가져옵니다.',
    },
  },
  create(context) {
    const apps = context.options[0]?.apps ?? [];
    const filename = toPosix(context.filename);
    const match = filename.match(/^(.*\/apps\/([^/]+)\/src)\/(.+)$/);
    if (!match || !apps.includes(match[2])) return {};

    const [, srcDir, app, relativeFile] = match;
    const alias = `@${app}/`;
    const fileDir = path.posix.dirname(filename);
    const segments = relativeFile.split('/');
    const moduleDir =
      segments.length > 2 ? `${srcDir}/${segments[0]}/${segments[1]}` : null;

    const check = (source) => {
      if (source?.type !== 'Literal' || typeof source.value !== 'string') {
        return;
      }
      const quote = source.raw[0];
      const value = source.value;

      if (value.startsWith(alias)) {
        const target = `${srcDir}/${value.slice(alias.length)}`;
        if (!moduleDir || !isInside(target, moduleDir)) return;
        context.report({
          node: source,
          messageId: 'useRelative',
          fix: (fixer) =>
            fixer.replaceText(
              source,
              quote + toRelative(fileDir, target) + quote,
            ),
        });
        return;
      }

      if (value.startsWith('../')) {
        const target = path.posix.join(fileDir, value);
        if (moduleDir && isInside(target, moduleDir)) return;
        context.report({
          node: source,
          messageId: 'useAlias',
          data: { alias },
          // src 밖을 가리키면 별칭으로 바꿀 수 없으므로 고치지 않고 알리기만 한다
          fix: isInside(target, srcDir)
            ? (fixer) =>
                fixer.replaceText(
                  source,
                  quote + alias + path.posix.relative(srcDir, target) + quote,
                )
            : null,
        });
      }
    };

    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
    };
  },
};
