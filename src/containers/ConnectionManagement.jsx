import styles from '../styles/connectionManagement.styl'

import React, { Component } from 'react'
import { cozyConnect } from 'redux-cozy-client'
import { connect } from 'react-redux'
import { NavLink, withRouter } from 'react-router-dom'

import { getAccount } from '../ducks/accounts'
import {
  endConnectionCreation,
  getTriggerLastSuccess,
  isConnectionRunning,
  isCreatingConnection,
  startConnectionCreation
} from '../ducks/connections'
import { getKonnector } from '../ducks/konnectors'
import {
  getConnectionsByKonnector,
  getCreatedConnectionAccount,
  getTriggerByKonnectorAndAccount,
  getKonnectorsInMaintenance
} from '../reducers'

import Icon from 'cozy-ui/react/Icon'
import Modal, { ModalContent, ModalHeader } from 'cozy-ui/react/Modal'
import AccountConnection from './AccountConnection'
import KonnectorHeaderIcon from '../components/KonnectorHeaderIcon'
import Notifier from '../components/Notifier'

import backIcon from '../assets/sprites/icon-arrow-left.svg'

class ConnectionManagement extends Component {
  constructor(props, context) {
    super(props, context)
    this.store = this.context.store

    const account = props.existingAccount || props.createdAccount

    // Set values
    const values = (account && Object.assign({}, account.auth)) || {}
    // Split the actual folderPath account to get namePath & folderPath values
    if (account && values.folderPath) {
      values.folderPath = account.auth.folderPath.substring(
        0,
        account.auth.folderPath.lastIndexOf('/')
      )
      values.namePath = account.auth.namePath
    } else if (
      (!account &&
        props.konnector.fields &&
        props.konnector.fields.advancedFields &&
        props.konnector.fields.advancedFields.folderPath) ||
      (!account && props.konnector.fields && props.konnector.folderPath)
    ) {
      values.folderPath = this.context.t('account.config.default_folder', {
        name: props.konnector.name
      })
    }

    this.state = {
      isClosing: false,
      values: values
    }

    this.store.fetchDriveUrl()

    if (!this.props.existingAccount) {
      if (this.props.isCreating) {
        console.warn &&
          console.warn(
            'Unexpected state: connection creation already in progress'
          )
      } else {
        this.props.startCreation()
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const isInvalidKonnectorSlug =
      nextProps.match &&
      nextProps.match.params.konnectorSlug &&
      !nextProps.konnector

    if (isInvalidKonnectorSlug) {
      console.warn && console.warn('Invalid konnector slug')
      return this.gotoParent()
    }

    const isInvalidAccountId =
      nextProps.match &&
      nextProps.match.params.accountId &&
      !nextProps.existingAccount
    if (isInvalidAccountId) {
      console.warn && console.warn('Invalid account id')
      return this.gotoParent()
    }
  }

  render() {
    const {
      backRoute,
      connections,
      createdAccount,
      existingAccount,
      getBackRoute,
      konnector
    } = this.props
    // Do not even render if there is no konnector (in case of wrong URL)
    if (!konnector) return

    const { isClosing, values } = this.state

    return (
      <Modal
        dismissAction={() => this.gotoParent()}
        mobileFullscreen
        size="large"
        className={styles['col-account-modal']}
      >
        <ModalHeader>
          <div className={styles['col-account-connection-header']}>
            {(backRoute || getBackRoute) && (
              <NavLink
                to={backRoute || getBackRoute(connections)}
                className={styles['col-account-connection-back']}
                onClick={this.onDone}
              >
                <Icon icon={backIcon} />
              </NavLink>
            )}
            <KonnectorHeaderIcon konnector={konnector} />
          </div>
        </ModalHeader>
        <ModalContent>
          <AccountConnection
            alertDeleteSuccess={messages => this.alertDeleteSuccess(messages)}
            displayAccountsCount
            editing={existingAccount && !createdAccount}
            onCancel={() => this.gotoParent()}
            isUnloading={isClosing}
            values={values}
            closeModal={() => this.gotoParent()}
            {...this.state}
            {...this.props}
            {...this.context}
          />
        </ModalContent>
      </Modal>
    )
  }

  alertDeleteSuccess(messages) {
    const { t } = this.context

    Notifier.info([
      messages
        .map(item => {
          return t(item.message, item.params)
        })
        .join('.\n')
    ])

    this.gotoParent()
  }

  onDone = account => {
    const { endCreation, isCreating, konnector, history } = this.props
    if (isCreating) {
      typeof endCreation === 'function' && endCreation()
    }
    if (account) {
      history.push(`/connected/${konnector.slug}/accounts/${account._id}`)
    }
  }

  gotoParent() {
    this.setState({ isClosing: true })

    // The setTimeout allows React to perform setState related actions
    setTimeout(() => {
      const { router } = this.context
      const { originPath } = this.props

      if (originPath) {
        const params = this.props.match.params
        const resolvedOriginPath = Object.keys(params)
          .filter(param => typeof params[param] === 'string')
          // Sort params from longest string to shortest string to avoid
          // unexpected replacements like :test in :test2.
          .sort(
            (a, b) => (a.length === b.length ? 0 : a.length > b.length ? -1 : 1)
          )
          .reduce(
            (path, param) => path.replace(`:${param}`, params[param]),
            originPath
          )
        router.history.push(resolvedOriginPath)
      } else {
        let url = router.history.location.pathname
        router.history.push(url.substring(0, url.lastIndexOf('/')))
      }

      if (this.props.isCreating) {
        this.props.endCreation()
      }
    }, 0)
  }
}

const mapActionsToProps = dispatch => ({})

// Accéder au state depuis ici ?
const mapDocumentsToProps = ownProps => ({
  // konnector: fetchRegistryKonnectorBySlug(ownProps.params.connectorSlug)
  // existingAccount: fetchAccount(ownProps.accountId)
})

const mapStateToProps = (state, ownProps) => {
  // infos from route parameters
  const { accountId, konnectorSlug } = ownProps.match && ownProps.match.params
  const konnector = getKonnector(state.cozy, konnectorSlug)
  const existingAccount = getAccount(state.cozy, accountId)
  const createdAccount = getCreatedConnectionAccount(state)
  const trigger = getTriggerByKonnectorAndAccount(
    state,
    konnector,
    existingAccount || createdAccount
  )
  const maintenance = getKonnectorsInMaintenance()
  return {
    connections: getConnectionsByKonnector(state, konnectorSlug),
    createdAccount,
    existingAccount,
    isCreating: isCreatingConnection(state.connections),
    konnector: konnector,
    isRunning: isConnectionRunning(state.connections, trigger),
    lastSuccess: getTriggerLastSuccess(state.cozy, trigger),
    trigger,
    maintenance: maintenance
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  startCreation: () => dispatch(startConnectionCreation(ownProps.konnector)),
  endCreation: () => dispatch(endConnectionCreation())
})

export default connect(mapStateToProps, mapDispatchToProps)(
  cozyConnect(mapDocumentsToProps, mapActionsToProps)(
    withRouter(ConnectionManagement)
  )
)
