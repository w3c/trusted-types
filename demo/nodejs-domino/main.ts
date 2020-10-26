import domino from 'domino'

// expose DOM API on the global scope
const g = global as any
g.window = domino.createWindow()
g.document = g.window.document
Object.entries((domino as any).impl).forEach(([key, value]) => {
  g[key] = value
})

import './another'
import {
  trustedTypes,
  TrustedTypeConfig,
  TrustedTypesEnforcer,
} from 'trusted-types'

function acceptOnlyTrustedHTML(html: TrustedHTML) {
  if (!trustedTypes.isHTML(html)) console.log('untrusted html', html)
  else console.log('trusted html', html)
}

const policy = trustedTypes.createPolicy('app', { createHTML: (s) => s })
acceptOnlyTrustedHTML('str' as any)
acceptOnlyTrustedHTML(policy.createHTML('safe html'))

const html = document.createElement('html')
html.appendChild(document.createElement('div'))
html.appendChild(document.createElement('div'))
html.appendChild(document.createElement('div'))

console.log(html.innerHTML)

// no fail
html.children[0].innerHTML = 'string'
console.log(html.innerHTML)

const config = new TrustedTypeConfig(true, true, ['foo'], false)
const enforcer = new TrustedTypesEnforcer(config)
enforcer.install()
const fooPolicy = trustedTypes.createPolicy('foo')
try {
  html.children[0].innerHTML = 'string' // should fail
  throw new Error('Unexpected code path')
} catch (err) {
  console.log('error', err)
  console.log(html.innerHTML)
}
html.children[0].innerHTML = fooPolicy.createHTML('safeHTML') as any // should work
console.log(html.innerHTML)

enforcer.uninstall()
html.children[0].innerHTML = 'string' // should work
console.log(html.innerHTML)
