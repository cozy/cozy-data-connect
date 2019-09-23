import React, { PureComponent } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import { withClient } from 'cozy-client'
import Icon from 'cozy-ui/react/Icon'

import { getApp, receiveApps } from 'ducks/apps'
import styles from 'styles/triggerFolderLink.styl'

/**
 * Renders a link only if href prop is provided
 */
class MaybeLink extends PureComponent {
  render() {
    const { className, href } = this.props
    return href ? (
      <a className={className} href={href} target="_parent">
        {this.props.children}
      </a>
    ) : (
      <span className={className}>{this.props.children}</span>
    )
  }
}

export class TriggerFolderLink extends PureComponent {
  async componentDidMount() {
    const { client, driveApp, receiveApps } = this.props
    if (!driveApp) {
      const { data } = await client.query(client.all('io.cozy.apps'))
      receiveApps(data)
    }
  }

  render() {
    const { driveApp, label, folderId } = this.props
    const disabled = !driveApp
    return (
      <MaybeLink
        className={classNames(styles['col-trigger-folder-link'], {
          'u-silver': disabled,
          'u-c-not-allowed': disabled
        })}
        href={driveApp && `${driveApp.links.related}#/files/${folderId}`}
      >
        <Icon className="u-mr-half" icon="openwith" />
        {label}
      </MaybeLink>
    )
  }
}

const mapStateToProps = state => ({
  driveApp: getApp(state.apps, 'drive')
})

const mapDispatchToProps = dispatch => {
  return {
    receiveApps: apps => dispatch(receiveApps(apps))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withClient(TriggerFolderLink))
