import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import 'url-search-params-polyfill'

import CozyClient, { CozyProvider } from 'cozy-client'
import { I18n } from 'cozy-ui/react/I18n'
import 'cozy-ui/transpiled/react/stylesheet.css'
import 'cozy-ui/dist/cozy-ui.min.css'

import schema from 'schema'
import configureStore from 'store/configureStore'

import { handleOAuthResponse } from 'cozy-harvest-lib'
import collectConfig from 'config/collect'
import PiwikHashRouter from 'lib/PiwikHashRouter'

import 'intro.js-fix-cozy/minified/introjs.min.css'
import 'styles/index.styl'

const lang = document.documentElement.getAttribute('lang') || 'en'

document.addEventListener('DOMContentLoaded', () => {
  if (handleOAuthResponse()) return

  const root = document.querySelector('[role=application]')
  const appData = root.dataset

  const cozyClient = new CozyClient({
    uri: `${window.location.protocol}//${appData.cozyDomain}`,
    schema,
    token: appData.cozyToken
  })

  const store = configureStore(cozyClient, {
    lang,
    ...collectConfig
  })

  cozyClient.setStore(store)

  const dictRequire = lang => require(`locales/${lang}`)
  const App = require('containers/App').default
  render(
    <CozyProvider client={cozyClient}>
      <Provider store={store}>
        <I18n lang={lang} dictRequire={dictRequire}>
          <PiwikHashRouter>
            <App {...collectConfig} />
          </PiwikHashRouter>
        </I18n>
      </Provider>
    </CozyProvider>,
    document.querySelector('[role=application]')
  )
})
