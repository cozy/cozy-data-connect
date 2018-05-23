import { cozyConnect } from 'redux-cozy-client'

import { initializeRegistry } from '../ducks/registry'
import { fetchAccounts } from '../ducks/accounts'
import { fetchApps } from '../ducks/apps'
import { fetchKonnectorJobs } from '../ducks/jobs'
import { fetchKonnectors } from '../ducks/konnectors'
import { fetchTriggers } from '../ducks/triggers'

const mapActionsToProps = dispatch => ({
  initializeRegistry: konnectors => dispatch(initializeRegistry(konnectors))
})

const mapDocumentsToProps = (state, ownProps) => ({
  accounts: fetchAccounts(),
  apps: fetchApps(),
  jobs: fetchKonnectorJobs(),
  konnectors: fetchKonnectors(),
  triggers: fetchTriggers()
  // TODO: fetch registry
  // registry: fetchRegistry()
})

const appEntryPoint = (WrappedComponent, selectData) =>
  cozyConnect(mapDocumentsToProps, mapActionsToProps)(
    WrappedComponent,
    selectData
  )

export default appEntryPoint
