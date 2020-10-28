import domino from 'domino'
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

const win = domino.createWindow()
const doc = win.document

const html = doc.createElement('html')
html.appendChild(doc.createElement('div'))
html.appendChild(doc.createElement('div'))
html.appendChild(doc.createElement('div'))

console.log(html.innerHTML)

// no fail
html.children[0].innerHTML = 'string'
console.log(html.innerHTML)

const config = new TrustedTypeConfig(false, true, ['foo'], false)
const enforcer = new TrustedTypesEnforcer(config, win)
enforcer.install()
const fooPolicy = trustedTypes.createPolicy('foo', { createHTML: (s) => s })
try {
  html.children[0].innerHTML = 'string' // should fail
  throw new Error('Unexpected code path')
} catch (err) {
  console.log('Caught unsafe write to innerHTML property')
}

html.children[0].innerHTML = fooPolicy.createHTML('safeHTML') as any // should work
console.log(html.innerHTML)

enforcer.uninstall()
html.children[0].innerHTML = 'string after uninstall' // should work
console.log(html.innerHTML)

// it should work even with incomplete enforcer
const incompleteEnforcer = new TrustedTypesEnforcer(config, {} as Window)
incompleteEnforcer.install()
incompleteEnforcer.uninstall()
