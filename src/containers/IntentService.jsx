import React, { Component } from 'react'
import { connect } from 'react-redux'

import CreateAccountIntent from '../components/intents/CreateAccountIntent'
import { getKonnector, receiveInstalledKonnector } from '../ducks/konnectors'

class IntentService extends Component {
  handleInstallationSuccess(konnector) {
    this.props.receiveKonnector(konnector)
  }

  async componentDidMount() {
    const { data, konnector, receiveKonnector, service } = this.props
    if (service && !konnector) {
      const installedKonnector = await service.compose(
        'INSTALL',
        'io.cozy.apps',
        data
      )

      // if installedKonnector is null, it means the installation have been
      // cancelled
      if (!installedKonnector) {
        return service.cancel()
      }

      receiveKonnector(installedKonnector)
    }
  }

  onError(error) {
    this.setState({
      error: error
    })
  }

  render() {
    const { appData, konnector, onCancel, service } = this.props
    const { error } = this.state
    const { t } = this.context

    return (
      <div className="coz-service">
        {error && (
          <div className="coz-error coz-service-error">
            <p>{t(error.message)}</p>
            {error.reason && (
              <p>{t('intent.service.error.cause', { error: error.reason })}</p>
            )}
          </div>
        )}
        {!error &&
          konnector && (
            <CreateAccountIntent
              appData={appData}
              konnector={konnector}
              onCancel={onCancel}
              onTerminate={service.terminate}
            />
          )}
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  receiveKonnector: konnector => dispatch(receiveInstalledKonnector(konnector))
})

const mapStateToProps = (state, ownProps) => {
  const { data } = ownProps
  const { slug } = data
  return {
    konnector: slug && getKonnector(state.cozy, slug)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(IntentService)
