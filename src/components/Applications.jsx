import React, { memo } from 'react'
import { connect } from 'react-redux'

import { Query, Q } from 'cozy-client'
import { translate } from 'cozy-ui/react/I18n'
import flag from 'cozy-flags'

import AppTile from 'components/AppTile'
import LogoutTile from 'components/LogoutTile'
import LoadingPlaceholder from 'components/LoadingPlaceholder'
import homeConfig from 'config/collect'
import { receiveApps } from 'ducks/apps'

const LoadingAppTiles = memo(({ num }) => {
  const tiles = []
  for (let i = 0; i < num; i++) {
    tiles.push(
      <div className="item-wrapper" key={i}>
        <header className="item-header">
          <div className="item-icon">
            <LoadingPlaceholder />
          </div>
        </header>
        <h3 className="item-title">
          <LoadingPlaceholder />
        </h3>
      </div>
    )
  }
  return <>{tiles}</>
})
LoadingAppTiles.displayName = LoadingAppTiles

const Applications = memo(({ receiveApps }) => {
  const showLogout = !!flag('home.mainlist.show-logout')
  return (
    <div className="app-list">
      <Query query={() => Q('io.cozy.apps')}>
        {({ data, fetchStatus }) => {
          if (fetchStatus === 'loaded') {
            receiveApps(data)
          }
          return fetchStatus !== 'loaded' ? (
            <LoadingAppTiles num="3" />
          ) : (
            data
              .filter(
                app =>
                  app.state !== 'hidden' &&
                  !homeConfig.filteredApps.includes(app.slug) &&
                  !flag(`home_hidden_apps.${app.slug.toLowerCase()}`) // can be set in the context with `home_hidden_apps: - drive - banks`for example
              )
              .map((app, index) => <AppTile key={index} app={app} />)
          )
        }}
      </Query>
      {showLogout && <LogoutTile />}
    </div>
  )
})
Applications.displayName = Applications

const mapDispatchToProps = dispatch => {
  return {
    receiveApps: apps => dispatch(receiveApps(apps))
  }
}

export default connect(
  null,
  mapDispatchToProps
)(translate()(Applications))
