import styles from '../styles/konnectorSuccess'

import React from 'react'
import { translate } from 'cozy-ui/react/I18n'
import { NavLink } from 'react-router-dom'
import classNames from 'classnames'

import DescriptionContent from './DescriptionContent'

export const KonnectorSuccess = ({
  t,
  connector,
  isTimeout,
  account,
  error,
  folderId,
  onCancel,
  onNext,
  driveUrl,
  title,
  messages,
  successButtonLabel
}) => {
  return (
    account && (
      <div>
        <DescriptionContent
          title={!error && title}
          messages={!error && messages}
        >
          {Array.isArray(connector.dataType) &&
            connector.dataType.includes('bill') && (
              <p>
                {!error &&
                  t(
                    `account.message.${isTimeout ? 'syncing' : 'synced'}.bill`,
                    {
                      name: connector.name
                    }
                  )}
                <br />
                {account.auth.folderPath && (
                  <span
                    className={styles['col-account-folder-highlighted-data']}
                  >
                    {account.auth.folderPath}
                  </span>
                )}
                {driveUrl &&
                  folderId && (
                    <a
                      className={styles['col-account-folder-link']}
                      href={`${driveUrl}${folderId}`}
                    >
                      {t('account.folder.link')}
                    </a>
                  )}
              </p>
            )}
        </DescriptionContent>

        <div className={styles['coz-form-controls']}>
          <div className={styles['col-account-form-success-buttons']}>
            <p>
              <NavLink
                to={`/connected/${connector.slug}/${account._id}`}
                className={classNames(styles['coz-btn'], 'col-button')}
              >
                {successButtonLabel || t('account.success.button.config')}
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    )
  )
}

export default translate()(KonnectorSuccess)
