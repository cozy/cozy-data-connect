import React from 'react'

import Dialog from './Dialog'

// Fallback to get the item icon and avoid error if not found
// with a possible default icon
const getIcon = (iconName, enableDefaultIcon) => {
  let icon = ''
  try {
    icon = require(`../assets/icons/white/${iconName}.svg`)
  } catch (e) {
    if (enableDefaultIcon) {
      icon = require('../assets/icons/white/default.svg')
    }
  }
  return icon
}

const ConnectorDialog = ({ slug, iconName, color, enableDefaultIcon, children }) => (
  <Dialog
    className='connector-dialog'
    headerStyle={{background: color || 'white'}}
    headerIcon={getIcon(iconName || slug, enableDefaultIcon)}
  >
    {children}
  </Dialog>
)

export default ConnectorDialog
