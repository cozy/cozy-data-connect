import { getKonnectorIcon } from '../../lib/icons'

import { getTriggerLastJob } from '../jobs'
import { getKonnectorAccount } from './konnector'

import { deleteTrigger, launchTrigger } from '../triggers'
import { deleteAccount, getAccount } from '../accounts'

// constant
const TRIGGERS_DOCTYPE = 'io.cozy.triggers'
const JOBS_DOCTYPE = 'io.cozy.jobs'

export const CREATE_CONNECTION = 'CREATE_CONNECTION'
export const CONNECTION_DELETED = 'CONNECTION_DELETED'
export const DELETE_CONNECTION = 'DELETE_CONNECTION'
export const ENQUEUE_CONNECTION = 'ENQUEUE_CONNECTION'
export const LAUNCH_TRIGGER = 'LAUNCH_TRIGGER'
export const PURGE_QUEUE = 'PURGE_QUEUE'
export const RECEIVE_DATA = 'RECEIVE_DATA'
export const RECEIVE_NEW_DOCUMENT = 'RECEIVE_NEW_DOCUMENT'
export const UPDATE_CONNECTION_RUNNING_STATUS =
  'UPDATE_CONNECTION_RUNNING_STATUS'
export const UPDATE_CONNECTION_ERROR = 'UPDATE_CONNECTION_ERROR'

// Helpers
const getTriggerKonnectorSlug = trigger =>
  (trigger && trigger.message && trigger.message.konnector) || null

const isKonnectorTrigger = doc =>
  doc._type === TRIGGERS_DOCTYPE && !!doc.message && !!doc.message.konnector

const isKonnectorJob = doc =>
  doc._type === JOBS_DOCTYPE && doc.worker === 'konnector'

// reducers
const reducer = (state = {}, action) => {
  switch (action.type) {
    case CONNECTION_DELETED:
    case DELETE_CONNECTION:
      if (!action.trigger || !action.trigger._id)
        throw new Error('Missing trigger id')
      if (!action.trigger.message || !action.trigger.message.konnector)
        throw new Error('Malformed trigger message')
      return {
        ...state,
        [getTriggerKonnectorSlug(action.trigger)]: konnectorReducer(
          state[getTriggerKonnectorSlug(action.trigger)],
          action
        )
      }
    case CREATE_CONNECTION:
    case ENQUEUE_CONNECTION:
    case UPDATE_CONNECTION_ERROR:
    case UPDATE_CONNECTION_RUNNING_STATUS:
    case LAUNCH_TRIGGER:
      // Trigger is launched, connection should be running.
      if (!action.trigger || !action.trigger._id)
        throw new Error('Missing trigger id')
      if (!action.trigger.message || !action.trigger.message.konnector)
        throw new Error('Malformed trigger message')
      return {
        ...state,
        [getTriggerKonnectorSlug(action.trigger)]: konnectorReducer(
          state[getTriggerKonnectorSlug(action.trigger)],
          action
        )
      }

    case RECEIVE_DATA:
    case RECEIVE_NEW_DOCUMENT:
      if (
        !action.response ||
        !action.response.data ||
        !action.response.data.length
      ) {
        return state
      }

      return action.response.data.reduce((newState, doc) => {
        const isTrigger = isKonnectorTrigger(doc)
        const isJob = isKonnectorJob(doc)
        // Ignore non triggers or non jobs
        if (!isTrigger && !isJob) return newState
        const konnectorSlug = doc.message.konnector
        const triggerId = (isTrigger && doc._id) || (isJob && doc.trigger_id)
        if (!triggerId) return newState

        const account = isTrigger && !!doc.message && doc.message.account

        const currentStatus =
          (isTrigger && (doc.current_state && doc.current_state.status)) ||
          (isJob && doc.state)
        if (!currentStatus) return newState

        const error =
          (isTrigger &&
            !!doc.current_state &&
            !!doc.current_state.last_error && {
              message: doc.current_state.last_error
            }) ||
          (isJob && !!doc.error && { message: doc.error }) ||
          null

        return {
          ...newState,
          [konnectorSlug]: {
            triggers: {
              ...((newState[konnectorSlug] &&
                newState[konnectorSlug].triggers) ||
                {}),
              [triggerId]: {
                ...((newState[konnectorSlug] &&
                  newState[konnectorSlug].triggers &&
                  newState[konnectorSlug].triggers[triggerId]) ||
                  {}),
                account:
                  account ||
                  newState[konnectorSlug].triggers[triggerId].account,
                error,
                hasError: !!error || currentStatus === 'errored',
                isRunning: ['queued', 'running'].includes(currentStatus),
                isConnected: !error && currentStatus === 'done'
              }
            }
          }
        }
      }, state)

    case PURGE_QUEUE:
      return Object.keys(state).reduce((konnectors, slug) => {
        return { ...konnectors, [slug]: konnectorReducer(state[slug], action) }
      }, state)
    default:
      return state
  }
}

export default reducer

// sub(?) reducers
const konnectorReducer = (state = {}, action) => {
  switch (action.type) {
    case CONNECTION_DELETED:
    case DELETE_CONNECTION:
    case ENQUEUE_CONNECTION:
    case LAUNCH_TRIGGER:
    case RECEIVE_DATA:
    case RECEIVE_NEW_DOCUMENT:
    case PURGE_QUEUE:
      // We assume that document being a trigger has already been validated.
      return {
        ...state,
        triggers: triggersReducer(state.triggers, action)
      }
    default:
      return state
  }
}

const triggersReducer = (state = {}, action) => {
  switch (action.type) {
    case DELETE_CONNECTION:
      return {
        ...state,
        [action.trigger._id]: {
          ...state[action.trigger._id],
          isDeleting: true
        }
      }
    case CONNECTION_DELETED:
      return (({ [action.trigger._id]: deleted, ...state }) => state)(state)
    case ENQUEUE_CONNECTION:
      return {
        ...state,
        [action.trigger._id]: {
          ...state[action.trigger._id],
          isEnqueued: true
        }
      }
    case LAUNCH_TRIGGER:
      return {
        ...state,
        [action.trigger._id]: {
          ...state[action.trigger._id],
          account: action.trigger.message.account,
          isRunning: true
        }
      }
    case PURGE_QUEUE:
      return Object.keys(state).reduce((newState, triggerId) => {
        return {
          ...newState,
          [triggerId]: {
            ...newState[triggerId],
            isEnqueued: false
          }
        }
      }, state)
    default:
      return state
  }
}

// action creators sync
export const createConnection = (konnector, account, folder) => ({
  type: CREATE_CONNECTION,
  konnector,
  account,
  folder
})

export const enqueueConnection = trigger => ({
  type: ENQUEUE_CONNECTION,
  trigger
})

export const purgeQueue = () => ({
  type: PURGE_QUEUE
})

export const updateConnectionError = (konnector, account, error) => ({
  type: UPDATE_CONNECTION_ERROR,
  konnector,
  account,
  error
})

// export const updateConnectionRunningStatus = (
//   konnector,
//   account,
//   isRunning = false
// ) => ({
//   type: UPDATE_CONNECTION_RUNNING_STATUS,
//   konnector,
//   account,
//   isRunning
// })

// action creators async
export const deleteConnection = trigger => {
  return (dispatch, getState) => {
    dispatch({
      type: DELETE_CONNECTION,
      trigger: trigger
    })
    const account = getTriggerAccount(getState(), trigger)
    return dispatch(deleteTrigger(trigger))
      .then(() => {
        dispatch(deleteAccount(account))
      })
      .then(() =>
        dispatch({
          type: CONNECTION_DELETED,
          trigger: trigger
        })
      )
    // .then(() => dispatch(unlinkFolder(account, folder)))
  }
}

export const launchTriggerAndQueue = (trigger, delay = 7000) => (
  dispatch,
  getState,
  options
) => {
  setTimeout(() => {
    if (isConnectionRunning(getState().connections, trigger)) {
      dispatch(enqueueConnection(trigger))
    }
  }, delay)

  return dispatch(launchTrigger(trigger))
}

// selectors
export const getConnectionStatus = (
  state,
  konnector,
  existingAccountIds = []
) => {
  // Sould we access `state.connections` from here ?
  const triggers = state[konnector.slug] && state[konnector.slug].triggers

  if (!triggers) return null

  const validTriggers = Object.keys(triggers).filter(triggerId => {
    return existingAccountIds.includes(triggers[triggerId].account)
  })

  if (!validTriggers.length) return null

  const triggerId = validTriggers[0]

  if (triggers[triggerId].isRunning) return 'running'
  if (triggers[triggerId].isConnected) return 'connected'
  return 'errored'
}

export const getKonnectorConnectedAccount = (state, konnector) => {
  return getKonnectorAccount(state[konnector.slug])
}

const getConnectionStatusFromTrigger = trigger => {
  if (trigger.isRunning) return 'ongoing'
  if (trigger.hasError) return 'error'
  if (trigger.isConnected) return 'done'
  return 'pending'
}

export const getQueue = (state, registryKonnectors) => {
  // state is state.connections
  return Object.keys(state).reduce((queuedConnections, konnectorSlug) => {
    const triggers = state[konnectorSlug].triggers
    if (!triggers) return queuedConnections
    const registryKonnector = registryKonnectors.data[konnectorSlug]
    return queuedConnections.concat(
      Object.keys(triggers).reduce((queuedTriggers, triggerId) => {
        if (triggers[triggerId].isEnqueued) {
          const label = registryKonnector.name
          const status = getConnectionStatusFromTrigger(triggers[triggerId])
          const icon = getKonnectorIcon(registryKonnector)
          return queuedTriggers.concat({ label, status, icon })
        }

        return queuedTriggers
      }, [])
    )
  }, [])
}

export const getConfiguredKonnectors = (state, existingAccountIds = []) =>
  Object.keys(state).filter(
    konnectorSlug =>
      !!state[konnectorSlug] &&
      !!Object.keys(state[konnectorSlug].triggers).find(triggerId => {
        const connection = state[konnectorSlug].triggers[triggerId]
        return (
          existingAccountIds.includes(connection.account) &&
          (connection.isConnected ||
            connection.isRunning ||
            connection.isEnqueued ||
            connection.hasError)
        )
      })
  )

export const getConnectionError = (state, trigger) =>
  getTriggerState(state, trigger).error

export const getTriggerAccount = (state, trigger) => {
  return getAccount(state.cozy, trigger.message.account)
}

export const getTriggerLastExecution = (state, trigger) => {
  const lastJob = getTriggerLastJob(state, trigger)
  if (lastJob) return lastJob.started_at
  return (
    !!trigger && !!trigger.current_state && trigger.current_state.last_execution
  )
}

export const getConnectionsStatusesByKonnectors = (state, konnectorSlugs) =>
  konnectorSlugs.map(slug => {
    return getConnectionStatus(state, slug)
  })

// get trigger from state, in state[konnectorSlug].triggers[triggerId]
const getTriggerState = (state, trigger) => {
  const konnectorSlug = getTriggerKonnectorSlug(trigger)
  if (!konnectorSlug || !state[konnectorSlug]) return false
  const triggers = state[konnectorSlug].triggers
  if (!triggers) return false
  return (!!triggers && !!triggers[trigger._id] && triggers[trigger._id]) || {}
}

export const isConnectionConnected = (state, trigger) =>
  getTriggerState(state, trigger).isConnected

export const isConnectionDeleting = (state, trigger) =>
  getTriggerState(state, trigger).isDeleting

export const isConnectionEnqueued = (state, trigger) =>
  getTriggerState(state, trigger).isEnqueued

export const isConnectionRunning = (state, trigger) =>
  getTriggerState(state, trigger).isRunning
