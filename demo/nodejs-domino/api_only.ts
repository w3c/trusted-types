// This file shows how to use the API of trusted types (without any enforcement).
import { trustedTypes } from 'trusted-types'

function acceptOnlyTrustedHTML(html: TrustedHTML) {
  if (!trustedTypes.isHTML(html)) console.log('untrusted html', html)
  else console.log('trusted html', html)
}

const policy = trustedTypes.createPolicy('app', { createHTML: (s) => s })
acceptOnlyTrustedHTML('str' as any)
acceptOnlyTrustedHTML(policy.createHTML('safe html'))
