import { array } from './ArrayArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { buildLowerAlphaNumericArb } from './helpers/SpecificCharacterRange';
import { domain } from './HostArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

/**
 * For email address
 *
 * According to RFC 5322 - https://www.ietf.org/rfc/rfc5322.txt
 *
 * @param constraints
 */
export function emailAddress(constraints?: { domain?: Arbitrary<string> }) {
  const c = constraints || {};
  const others = ['!', '#', '$', '%', '&', "'", '*', '+', '-', '/', '=', '?', '^', '_', '`', '{', '|', '}', '~'];
  const atextArb = buildLowerAlphaNumericArb(others);
  const dotAtomArb = array(stringOf(atextArb, 1, 10), 1, 5).map(a => a.join('.'));
  const domainArb = c.domain || domain();
  return tuple(dotAtomArb, domainArb).map(([lp, d]) => `${lp}@${d}`);
}
