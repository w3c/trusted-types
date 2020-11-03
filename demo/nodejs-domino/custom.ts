import domino from 'domino'
import './another'
import {
  trustedTypes,
  TrustedTypeConfig,
  TrustedTypesEnforcer,
} from 'trusted-types'

// create custom DOM API implementation
const win = domino.createWindow()
const doc = win.document

const html = doc.createElement('html')
html.appendChild(doc.createElement('div'))
html.appendChild(doc.createElement('div'))
console.log(html.innerHTML)

// no enforcement yet, assignment should work
html.children[0].innerHTML = 'string'
console.log(html.innerHTML)

// start enforcing mode
const config = new TrustedTypeConfig(
  false,
  true,
  ['foo', 'default'],
  false,
  undefined,
  win,
)
const enforcer = new TrustedTypesEnforcer(config)
enforcer.install()
const fooPolicy = trustedTypes.createPolicy('foo', { createHTML: (s) => s })

// we expect string assignment to sink to fail
let caught = false
try {
  html.children[0].innerHTML = 'string' // should fail
} catch (err) {
  caught = true
}
if (caught) console.log('Caught unsafe write to innerHTML property')
else throw new Error("Didn't catch unsafe write to innerHTML property!")

// trusted value assignment should pass
html.children[0].innerHTML = fooPolicy.createHTML('safeHTML') as any
console.log(html.innerHTML)

// Default policy
trustedTypes.createPolicy('default', { createHTML: (s) => s + '-default' })

// after we uninstall enforcer, raw assignments should work again
enforcer.uninstall()
html.children[0].innerHTML = 'string after uninstall'
console.log(html.innerHTML)

html.children[0].innerHTML = 'string' // should be rewritten to 'string-default'
console.log(html.children[0].innerHTML)

// it should work even with incomplete enforcer
const config2 = new TrustedTypeConfig(
  false,
  true,
  ['foo', 'default'],
  false,
  undefined,
  {} as Window,
)
const incompleteEnforcer = new TrustedTypesEnforcer(config2)
incompleteEnforcer.install()
incompleteEnforcer.uninstall()
