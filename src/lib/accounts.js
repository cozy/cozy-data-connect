/* accounts lib ready to be added to cozy-client-js */
import * as realtime from './realtime'

export const ACCOUNTS_DOCTYPE = 'io.cozy.accounts'

export function subscribeAll(cozy) {
  return realtime.subscribeAll(cozy, ACCOUNTS_DOCTYPE)
}
