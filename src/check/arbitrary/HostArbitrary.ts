import { array } from './ArrayArbitrary';
import { constant } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import {
  buildAlphaNumericPercentArb,
  buildLowerAlphaArb,
  buildLowerAlphaNumericArb
} from './helpers/SpecificCharacterRange';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

/**
 * For subdomains
 *
 * According to RFC 1034 - https://www.ietf.org/rfc/rfc1034.txt
 */
export function subdomain() {
  const alphaNumericArb = buildLowerAlphaNumericArb([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArb(['-']);
  return tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb), alphaNumericArb)))
    .map(([f, d]) => (d === null ? f : `${f}${d[0]}${d[1]}`))
    .filter(d => d.length <= 63);
}

/**
 * For domains
 *
 * According to RFC 1034 - https://www.ietf.org/rfc/rfc1034.txt
 *
 * @param constraints Optional customizations of the domain
 * @param constraints.prefix Enforce a specific arbitrary to generate the first subdomain, eg.: www.
 * @param constraints.suffix Enforce a specific arbitrary to generate the last subdomain, eg.: .com
 */
export function domain(constraints?: { suffix?: Arbitrary<string>; prefix?: Arbitrary<string> }) {
  const prefixesArb =
    constraints !== undefined && constraints.prefix !== undefined ? constraints.prefix.map(p => [p]) : constant([]);
  const suffixesArb =
    constraints !== undefined && constraints.suffix !== undefined ? constraints.suffix.map(p => [p]) : constant([]);
  return tuple(prefixesArb, array(subdomain(), 1, 5), suffixesArb)
    .map(([p, mid, s]) => [...p, ...mid, ...s].join('.'))
    .filter(d => d.length <= 255);
}

/**
 * For domains having an extension with at least two characters
 *
 * According to RFC 1034 - https://www.ietf.org/rfc/rfc1034.txt
 */
export function externalDomain() {
  const alphaNumericArb = buildLowerAlphaArb([]);
  return domain({ suffix: stringOf(alphaNumericArb, 2, 10) });
}

/**
 * For host user info
 *
 * RFC 3986 defines: userinfo = *( unreserved / pct-encoded / sub-delims / ":" )
 */
export function hostUserInfo() {
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':'];
  return stringOf(buildAlphaNumericPercentArb(others));
}
