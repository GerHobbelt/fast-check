import * as fc from '../../../src/fast-check';
import { URL } from 'url';

const seed = Date.now();
describe(`WebArbitrary (seed: ${seed})`, () => {
  it('Should produce valid domains', () => {
    fc.assert(
      fc.property(fc.anyDomain(), domain => {
        // Integer like domains have a special behaviour:
        // http://8 is equivalent to http://0.0.0.8
        fc.pre(Number.isNaN(parseInt(domain, 10)));
        const p = `http://user:pass@${domain}/path/?query#fragment`;
        const u = new URL(p);
        expect(u.hostname).toEqual(domain);
      }),
      { seed: seed }
    );
  });
  it('Should produce valid authorities', () => {
    fc.assert(
      fc.property(
        fc.webAuthority({
          domain: fc.constant('github.com'),
          withIPv4: false,
          withIPv6: false,
          withUserInfo: true,
          withPort: true
        }),
        authority => {
          const p = `http://${authority}`;
          const u = new URL(p);
          expect(u.hostname).toEqual('github.com');
        }
      ),
      { seed: seed }
    );
  });
  it('Should produce valid URL parts', () => {
    fc.assert(
      fc.property(
        fc.webAuthority({ domain: fc.anyDomain(), withIPv4: true, withIPv6: true, withUserInfo: true, withPort: true }),
        fc.array(fc.webSegment()).map(p => p.map(v => `/${v}`).join('')),
        fc.webQueryParameters(),
        fc.webFragments(),
        (authority, path, query, fragment) => {
          const p = `http://${authority}${path}?${query}#${fragment}`;
          const u = new URL(p);
          expect({ search: decodeURIComponent(u.search), hash: u.hash }).toEqual({
            search: query === '' ? '' : decodeURIComponent(`?${query}`),
            hash: fragment === '' ? '' : `#${fragment}`
          });

          const dotSanitizedPath = path
            .replace(/\/(%2e|%2E)($|\/)/g, '/.$2')
            .replace(/\/(%2e|%2E)(%2e|%2E)($|\/)/g, '/..$3');
          if (!dotSanitizedPath.includes('/..')) {
            const sanitizedPath = dotSanitizedPath
              .replace(/\/\.\/(\.\/)*/g, '/') // replace /./, /././, etc.. by /
              .replace(/\/\.$/, '/'); // replace trailing /. by / if any
            //.replace(/\/+/g, '/'); // collapse multiple consecutive slashes into a single one
            expect(u.pathname).toEqual(sanitizedPath === '' ? '/' : sanitizedPath);
          }
        }
      ),
      { seed: seed, numRuns: 10000 }
    );
  });
});
