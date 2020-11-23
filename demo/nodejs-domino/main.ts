import domino from 'domino'
import {
  trustedTypes,
  TrustedTypeConfig,
  TrustedTypesEnforcer,
} from 'trusted-types'

// expose DOM API on the global scope
const g = global as any
g.window = domino.createWindow()
g.document = g.window.document
Object.entries((domino as any).impl).forEach(([key, value]) => {
  g[key] = value
})

// console logs whether the global DOM symbols
import './another'

const html = document.createElement('html')
html.appendChild(document.createElement('div'))
html.appendChild(document.createElement('div'))
html.appendChild(document.createElement('div'))
console.log(html.innerHTML)

// no enforcement yet, assignment should work
html.children[0].innerHTML = 'string'
console.log(html.innerHTML)

// start enforcing mode
const config = new TrustedTypeConfig(false, true, ['foo', 'default'], false)
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
