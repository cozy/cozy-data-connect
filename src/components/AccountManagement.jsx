import React from 'react'
import TimeAgo from 'timeago-react'
import statefulForm from '../lib/statefulForm'

import AccountConfigForm from './AccountConfigForm'

const AccountManagement = (props) => {
  const { t, locale, accounts, selectedAccount, lastImport, dirty, submit, cancel } = props
  const { submitting, synching, deleting } = props
  const { selectAccount, addAccount, synchronize, deleteAccount } = props
  const isLoginFilled = !!props.values.login
  return (
    <div>
      <div className='account-management'>
        <div className='account-list'>
          <ul>
            {accounts.map((account, key) => (
              <li className={selectedAccount === key ? 'selected' : ''}>
                <a onClick={() => selectAccount(key)}>
                  {account.login
                    ? account.login
                    : t('account index', {index: key + 1})}
                </a>
              </li>
            ))}
          </ul>
          <a className='add-button' onClick={() => addAccount()}>{t('add_account button')}</a>
        </div>
        <div className='account-config'>
          <div>
            <h3>{t('activity')}</h3>
            <p>
              {t('activity desc')}
              {synching
                ? t('activity running')
                : lastImport && <TimeAgo datetime={lastImport} locale={locale} />
              }
            </p>
            <button className='flat' disabled={synching} onClick={() => synchronize()}>
              {t('activity button')}
            </button>
          </div>
          <AccountConfigForm {...props} />
          {isLoginFilled
          ? <div>
            <h3>{t('disconnect')}</h3>
            <p>
              {t('disconnect desc')}
            </p>
            <button className='danger' disabled={deleting} onClick={() => deleteAccount(selectedAccount)}>
              {t('disconnect button')}
            </button>
          </div>
          : <div>
            <button className='danger' disabled={deleting} onClick={() => deleteAccount(selectedAccount)}>
              {t('delete button')}
            </button>
          </div>}

        </div>
      </div>
      <div className='account-management-controls'>
        <button className='cancel' onClick={cancel}>
          {t('account cancel button')}
        </button>
        <button
          disabled={!dirty}
          aria-busy={submitting ? 'true' : 'false'}
          onClick={submit}
        >
          {t('account save button')}
        </button>
      </div>
    </div>
  )
}

export default statefulForm()(AccountManagement)
