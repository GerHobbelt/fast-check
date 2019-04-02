import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { webUrl } from '../../../../src/check/arbitrary/WebArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';
import fc from '../../../../lib/fast-check';

const isValidUrl = (t: string) => {
  try {
    decodeURI(t);
    return true;
  } catch (err) {
    return false;
  }
};

describe('WebArbitrary', () => {
  describe('webUrl', () => {
    genericHelper.isValidArbitrary(c => webUrl(c), {
      isValidValue: (g: string) => isValidUrl(g),
      seedGenerator: fc.record(
        {
          validSchemes: fc.constant(['ftp']),
          authoritySettings: fc.record(
            {
              domain: fc.constant(constant('github.com')),
              withIPv4: fc.boolean(),
              withIPv6: fc.boolean(),
              withUserInfo: fc.boolean(),
              withPort: fc.boolean()
            },
            { withDeletedKeys: true }
          ),
          withQueryParameters: fc.boolean(),
          withFragments: fc.boolean()
        },
        { withDeletedKeys: true }
      )
    });
  });
});
