import { constant } from '../../fast-check-default';
import { array } from './ArrayArbitrary';
import { constantFrom } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { buildAlphaNumericPercentArb, buildLowerAlphaNumericArb } from './helpers/SpecificCharacterRange';
import { domain, hostUserInfo } from './HostArbitrary';
import { nat } from './IntegerArbitrary';
import { ipV4, ipV6 } from './IpArbitrary';
import { oneof } from './OneOfArbitrary';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

/**
 * For web authority
 *
 * RFC 3986 defines: authority = [ userinfo "@" ] host [ ":" port ]
 *
 * @param constraints Optional customizations of the domain
 * @param constraints.domain Enforce a specific arbitrary to generate domains
 * @param constraints.withIPv4 Enable IPv4 in host
 * @param constraints.withIPv6 Enable IPv6 in host
 * @param constraints.withUserInfo Enable user information prefix
 * @param constraints.withPort Enable port suffix
 */
export function webAuthority(constraints?: {
  domain?: Arbitrary<string>;
  withIPv4?: boolean;
  withIPv6?: boolean;
  withUserInfo?: boolean;
  withPort?: boolean;
}) {
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

function uriSegment() {
  // pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
  // segment       = *pchar
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@'];
  return stringOf(buildAlphaNumericPercentArb(others));
}

function uriQueryOrFragment() {
  // query         = *( pchar / "/" / "?" )
  // fragment      = *( pchar / "/" / "?" )
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@', '/', '?'];
  return stringOf(buildAlphaNumericPercentArb(others));
}

/**
 *
 * @param constraints Optional customizations of the domain
 * @param constraints.scheme Enforce arbitrary for the scheme, eg.: http, https, ftp...
 * @param constraints.authority Enforce arbitrary for the authority, eg.: dubien.me...
 */
export function webUrl(constraints?: {
  validSchemes?: string[];
  authoritySettings?: (typeof webAuthority) extends ((a: infer U) => any) ? U : never;
  withQueryParameters?: boolean;
  withFragments?: boolean;
}) {
  const c = constraints || {};
  const validSchemes = c.validSchemes || ['http', 'https'];
  const schemeArb = constantFrom(...validSchemes);
  const authorityArb = webAuthority(c.authoritySettings);
  const pathArb = array(uriSegment()).map(p => p.map(v => `/${v}`).join(''));
  return tuple(
    schemeArb,
    authorityArb,
    pathArb,
    c.withQueryParameters === true ? option(uriQueryOrFragment()) : constant(null),
    c.withFragments === true ? option(uriQueryOrFragment()) : constant(null)
  ).map(([s, a, p, q, f]) => `${s}://${a}${p}${q === null ? '' : `?${q}`}${f === null ? '' : `#${f}`}`);
}

// addr-spec       =   local-part "@" domain
// local-part      =   dot-atom / quoted-string / obs-local-part
// dot-atom        =   1*atext *("." 1*atext)
// atext           =   ALPHA / DIGIT /
export function emailAddress(constraints?: { domain?: Arbitrary<string> }) {
  const c = constraints || {};
  const others = ['!', '#', '$', '%', '&', "'", '*', '+', '-', '/', '=', '?', '^', '_', '`', '{', '|', '}', '~'];
  const atextArb = buildLowerAlphaNumericArb(others);
  const dotAtomArb = array(stringOf(atextArb, 1, 10), 1, 5).map(a => a.join('.'));
  const domainArb = c.domain || domain();
  return tuple(dotAtomArb, domainArb).map(([lp, d]) => `${lp}@${d}`);
}
