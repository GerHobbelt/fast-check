import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { anyDomain } from '../../../../src/check/arbitrary/HostArbitrary';
import { webUrl } from '../../../../src/check/arbitrary/WebArbitrary';

import { URL } from 'url';
import * as genericHelper from './generic/GenericArbitraryHelper';
import fc from '../../../../lib/fast-check';

const isValidUrl = (t: string) => {
  try {
    // Issue reported concerning errors when parsing http://40000000000
    // There is pretty no chance to generate such domain but it still exists
    // See: https://github.com/nodejs/node/issues/27093

    // A TypeError will be thrown if the input is not a valid URL.
    // https://nodejs.org/api/url.html#url_constructor_new_url_input_base
    new URL(t);
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
              domain: fc.constantFrom(constant('github.com'), anyDomain()),
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
