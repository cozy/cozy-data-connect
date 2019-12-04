import React from 'react'
import PropTypes from 'prop-types'
import sortBy from 'lodash/sortBy'
import { connect } from 'react-redux'
import { withClient } from 'cozy-client'
import { queryConnect } from 'cozy-client'
import { translate } from 'cozy-ui/react/I18n'
import keyBy from 'lodash/keyBy'
import has from 'lodash/has'
import flow from 'lodash/flow'

import AddServiceTile from 'components/AddServiceTile'
import KonnectorTile from 'components/KonnectorTile'
import CandidateCategoryTile from 'components/CandidateCategoryTile'
import CandidateServiceTile from 'components/CandidateServiceTile'
import EmptyServicesListTip from 'components/EmptyServicesListTip'
import { getInstalledKonnectors } from 'reducers/index'
import useAppsInMaintenance from 'hooks/withAppsInMaintenance'
import candidatesConfig from 'config/candidates'

export const Services = ({
  t,
  installedKonnectors,
  suggestedKonnectorsQuery,
  client
}) => {
  const hasConnections = !!installedKonnectors.length
  const appsInMaintenance = useAppsInMaintenance(client)
  const appsInMaintenanceBySlug = keyBy(appsInMaintenance, 'slug')
  const suggestedKonnectors = suggestedKonnectorsQuery.data

  return (
    <>
      <div className={'services-list'}>
        {installedKonnectors.map((konnector, index) => (
          <KonnectorTile
            key={index}
            konnector={konnector}
            route={`connected/${konnector.slug}`}
            isInMaintenance={has(appsInMaintenanceBySlug, konnector.slug)}
          />
        ))}
        {!hasConnections &&
          suggestedKonnectors.length === 0 &&
          candidatesConfig.konnectors.map(candidate => (
            <CandidateServiceTile key={candidate.slug} konnector={candidate} />
          ))}
        {suggestedKonnectors
          // TODO turn this into a method on the model
          .filter(
            ({ slug }) =>
              !has(appsInMaintenanceBySlug, slug) &&
              !installedKonnectors.some(
                installedKonnector => installedKonnector.slug === slug
              )
          )
          .map(suggestion => (
            <CandidateServiceTile
              key={suggestion.slug}
              konnector={suggestion}
            />
          ))}
        {!hasConnections &&
          Object.entries(candidatesConfig.categories).map(
            ([category, slugs]) => (
              <CandidateCategoryTile
                key={category}
                slugs={slugs}
                category={category}
              />
            )
          )}
        {<AddServiceTile label={t('add_service')} />}
      </div>
      {!hasConnections &&
        suggestedKonnectors.length >= 1 && <EmptyServicesListTip />}
    </>
  )
}

Services.propTypes = {
  t: PropTypes.func.isRequired,
  installedKonnectors: PropTypes.arrayOf(
    PropTypes.shape({ slug: PropTypes.string })
  ).isRequired,
  suggestedKonnectorsQuery: PropTypes.shape({
    data: PropTypes.array.isRequired
  }).isRequired,
  client: PropTypes.object.isRequired
}

const query = client =>
  client
    .find('io.cozy.apps.suggestions')
    .where({ silenced: false })
    .sortBy([{ silenced: 'asc' }, { slug: 'asc' }])
    .indexFields(['silenced', 'slug'])

const mapStateToProps = state => {
  return {
    installedKonnectors: sortBy(getInstalledKonnectors(state), konnector =>
      konnector.name.toLowerCase()
    )
  }
}

export default flow(
  connect(mapStateToProps),
  translate(),
  queryConnect({ suggestedKonnectorsQuery: { query } }),
  withClient
)(Services)
