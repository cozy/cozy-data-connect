import { combineReducers } from 'redux'

import { reducer } from 'redux-cozy-client'
import * as fromAccounts from '../ducks/accounts'
import { fetchKonnectorsInMaintenance } from '../ducks/konnectors'
import * as fromTriggers from '../ducks/triggers'
import registry, * as fromRegistry from '../ducks/registry'
import connections, * as fromConnections from '../ducks/connections'

export default () =>
  combineReducers({
    connections,
    cozy: reducer,
    registry
  })

// selectors
export const getConnections = state =>
  fromConnections
    .getConnections(
      state.connections,
      fromAccounts.getIds(state.cozy),
      fromRegistry.getSlugs(state.registry)
    )
    .map(connection => ({
      account: fromAccounts.getAccount(state.cozy, connection.accountId),
      konnector: fromRegistry.getRegistryKonnector(
        state.registry,
        connection.konnectorSlug
      ),
      trigger: fromTriggers.getTrigger(state.cozy, connection.triggerId)
    }))

export const getConnectionsByKonnector = (state, konnectorSlug) =>
  fromConnections.getConnectionsByKonnector(
    state.connections,
    konnectorSlug,
    fromAccounts.getIds(state.cozy),
    fromRegistry.getSlugs(state.registry)
  )

export const getConfiguredKonnectors = state =>
  fromConnections.getConfiguredKonnectors(
    state.connections,
    fromAccounts.getIds(state.cozy)
  )

export const getConnectionStatus = (state, konnector) =>
  fromConnections.getConnectionStatus(
    state.connections,
    konnector,
    fromAccounts.getIds(state.cozy)
  )

export const getConnectionsQueue = state =>
  fromConnections.getQueue(state.connections, state.registry.konnectors)

export const getCreatedConnectionAccount = state =>
  fromAccounts.getAccount(
    state.cozy,
    fromConnections.getCreatedAccount(state.connections)
  )

export const getCreatedConnectionTrigger = state =>
  fromTriggers.getTrigger(
    state.cozy,
    fromConnections.getCreatedTrigger(state.connections)
  )

export const getKonnectorTriggersCount = (state, konnector) =>
  fromTriggers.getKonnectorTriggers(
    state.cozy,
    konnector,
    fromAccounts.getIds(state.cozy)
  ).length

export const getKonnectorConnectedAccount = (state, konnector) =>
  fromTriggers.getKonnectorConnectedAccount(
    state.cozy,
    konnector,
    fromAccounts.getIds(state.cozy)
  )

export const getKonnectorsInMaintenance = () => fetchKonnectorsInMaintenance()

export const getTriggerByKonnectorAndAccount = (state, konnector, account) => {
  const triggerId = fromConnections.getTriggerIdByKonnectorAndAccount(
    state.connections,
    konnector,
    account,
    fromAccounts.getIds(state.cozy)
  )
  return fromTriggers.getTrigger(state.cozy, triggerId)
}

export const isConnectionDeleting = state =>
  fromConnections.isConnectionDeleting(state.connections)
