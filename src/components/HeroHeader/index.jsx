import React from 'react'
import { useClient } from 'cozy-client'
import get from 'lodash/get'
import useInstanceSettings from 'hooks/useInstanceSettings'
import useCustomWallpaper from 'hooks/useCustomWallpaper'
import flag from 'cozy-flags'

import LogoutButton from './LogoutButton'
import SettingsButton from './SettingsButton'
import HelpButton from './HelpButton'

const cornerButtons = [
  {
    flagName: 'help-is-displayed',
    isDisplayedByDefault: true,
    Button: HelpButton
  },
  {
    flagName: 'settings-is-displayed',
    isDisplayedByDefault: false,
    Button: SettingsButton
  },
  {
    flagName: 'logout-is-displayed',
    isDisplayedByDefault: true,
    Button: LogoutButton
  }
]

const flagWithFallbackValue = (flagName, fallback) =>
  flag(flagName) === null ? fallback : flag(flagName)

export const HeroHeader = () => {
  const client = useClient()
  const {
    fetchStatus,
    data: { wallpaperLink }
  } = useCustomWallpaper(client)
  const rootURL = client.getStackClient().uri
  const { host } = new URL(rootURL)
  // TODO: getInstanceOptions returns only data-cozy dataset if data-cozy="{{.CozyData}}" is set
  // we need something else to get data not in CozyData
  // should be a client method or getInstanceOptions fix
  // see https://github.com/cozy/cozy-client/issues/977
  const { cozyDefaultWallpaper } = document.querySelector(
    '[role=application]'
  ).dataset

  let backgroundURL = null
  if (fetchStatus !== 'loading')
    backgroundURL = wallpaperLink || cozyDefaultWallpaper

  const { data: instanceSettings } = useInstanceSettings(client)
  const publicName = get(instanceSettings, 'public_name', '')

  return (
    <header
      role="image"
      className="hero-header"
      style={{ backgroundImage: `url(${backgroundURL})` }}
    >
      <div className="corner">
        {cornerButtons.map(({ flagName, isDisplayedByDefault, Button }) =>
          flagWithFallbackValue(
            `home.corner.${flagName}`,
            isDisplayedByDefault
          ) ? (
            <Button key={flagName} />
          ) : null
        )}
      </div>
      <div>
        <img className="hero-avatar" src={`${rootURL}/public/avatar`} />
      </div>
      <h1 className="hero-title">{publicName}</h1>
      <h2 className="hero-subtitle">{host}</h2>
    </header>
  )
}

export default HeroHeader
