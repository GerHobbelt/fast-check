import { constant } from '../../fast-check-default';
import { array } from './ArrayArbitrary';
import { constantFrom } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { buildAlphaNumericPercentArb } from './helpers/SpecificCharacterRange';
import { domain, hostUserInfo } from './HostArbitrary';
import { nat } from './IntegerArbitrary';
import { ipV4, ipV6 } from './IpArbitrary';
import { oneof } from './OneOfArbitrary';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

export interface WebAuthorityConstraints {
  /** Enforce a specific arbitrary to generate domains */
  domain?: Arbitrary<string>;
  /** Enable IPv4 in host */
  withIPv4?: boolean;
  /** Enable IPv6 in host */
  withIPv6?: boolean;
  /** Enable user information prefix */
  withUserInfo?: boolean;
  /** Enable port suffix */
  withPort?: boolean;
}

/**
 * For web authority
 *
 * According to RFC 3986 - https://www.ietf.org/rfc/rfc3986.txt - `authority = [ userinfo "@" ] host [ ":" port ]`
 *
 * @param constraints
 */
export function webAuthority(constraints?: WebAuthorityConstraints) {
  const c = constraints || {};
  const domainArb = c.domain || domain();
  const hostnameArbs = [domainArb]
    .concat(c.withIPv4 === true ? [ipV4()] : [])
    .concat(c.withIPv6 === true ? [ipV6().map(ip => `[${ip}]`)] : []);
  return tuple(
    c.withUserInfo === true ? option(hostUserInfo()) : constant(null),
    oneof(...hostnameArbs),
    c.withPort === true ? option(nat(65536)) : constant(null)
  ).map(([u, h, p]) => (u === null ? '' : `${u}@`) + h + (p === null ? '' : `:${p}`));
}

/**
 * For internal segment of an URI (web included)
 *
 * According to RFC 3986 - https://www.ietf.org/rfc/rfc3986.txt
 *
 * eg.: In the url `https://github.com/dubzzz/fast-check/`, `dubzzz` and `fast-check` are segments
 */
export function webSegment() {
  // pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
  // segment       = *pchar
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@'];
  return stringOf(buildAlphaNumericPercentArb(others));
}

/** @hidden */
function uriQueryOrFragment() {
  // query         = *( pchar / "/" / "?" )
  // fragment      = *( pchar / "/" / "?" )
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@', '/', '?'];
  return stringOf(buildAlphaNumericPercentArb(others));
}

export interface WebUrlConstraints {
  /** Enforce specific schemes, eg.: http, https */
  validSchemes?: string[];
  /** Settings for {@see webAuthority} */
  authoritySettings?: WebAuthorityConstraints;
  /** Enable query parameters in the generated url */
  withQueryParameters?: boolean;
  /** Enable fragments in the generated url */
  withFragments?: boolean;
}

/**
 * For web url
 *
 * According to RFC 3986 - https://www.ietf.org/rfc/rfc3986.txt
 *
 * @param constraints
 */
export function webUrl(constraints?: {
  validSchemes?: string[];
  authoritySettings?: WebAuthorityConstraints;
  withQueryParameters?: boolean;
  withFragments?: boolean;
}) {
  const c = constraints || {};
  const validSchemes = c.validSchemes || ['http', 'https'];
  const schemeArb = constantFrom(...validSchemes);
  const authorityArb = webAuthority(c.authoritySettings);
  const pathArb = array(webSegment()).map(p => p.map(v => `/${v}`).join(''));
  return tuple(
    schemeArb,
    authorityArb,
    pathArb,
    c.withQueryParameters === true ? option(uriQueryOrFragment()) : constant(null),
    c.withFragments === true ? option(uriQueryOrFragment()) : constant(null)
  ).map(([s, a, p, q, f]) => `${s}://${a}${p}${q === null ? '' : `?${q}`}${f === null ? '' : `#${f}`}`);
}