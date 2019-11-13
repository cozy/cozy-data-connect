import React, { Component } from 'react'
import classNames from 'classnames'

import { Icon, Spinner } from 'cozy-ui/react'
import palette from 'cozy-ui/stylus/settings/palette.json'
import { translate } from 'cozy-ui/react/I18n'

import styles from 'ducks/connections/components/queue/styles'
import AppIcon from 'components/AppIcon'

const Pending = translate()(props => (
  <span className={styles['item-pending']}>
    {props.t('Queue.item.pending')}
  </span>
))

class ProgressBar extends Component {
  state = {
    progress: 0
  }

  componentDidMount() {
    let elapsedTime = 0
    this.progressInterval = setInterval(() => {
      elapsedTime += 10
      let progress = (Math.atan(elapsedTime / 3e3) / (Math.PI / 2)) * 90
      this.setState({
        progress: progress
      })
    }, 25)
  }

  componentWillUnmount() {
    clearInterval(this.progressInterval)
  }

  render() {
    const { progress } = this.state
    return (
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
        className={classNames(styles['queue-item-progress-bar'])}
        style={{ width: `${progress}%` }}
        ref={progressBar => (this.progressBar = progressBar)}
      />
    )
  }
}

class Item extends Component {
  render() {
    const { konnector, label, status, t } = this.props
    const isOngoing = status === 'ongoing'
    let statusIcon
    switch (status) {
      case 'ongoing':
        statusIcon = (
          <Spinner
            noMargin
            className="u-ml-half"
            color={palette['dodgerBlue']}
          />
        )
        break
      case 'canceled':
        statusIcon = (
          <Icon className="u-ml-half" icon="cross" color={palette['monza']} />
        )
        break
      case 'error':
      case 'conflict':
        statusIcon = (
          <Icon className="u-ml-half" icon="warning" color={palette['monza']} />
        )
        break
      case 'done':
        statusIcon = (
          <Icon
            className="u-ml-half"
            icon="check-circleless"
            color={palette['emerald']}
          />
        )
        break
      case 'pending':
      default:
        statusIcon = <Pending />
        break
    }
    return (
      <div
        className={classNames(styles['queue-item'], {
          [styles['queue-item--done']]: status === 'done',
          [styles['queue-item--error']]: status === 'error'
        })}
      >
        <div className={classNames(styles['item-icon'])}>
          <AppIcon
            alt={t('app.logo.alt', { name: konnector.name })}
            className="c-"
            app={konnector}
          />
        </div>
        <div className={classNames(styles['item-label'])}>{label}</div>
        <div className={styles['item-status']}>{statusIcon}</div>
        {isOngoing && <ProgressBar />}
      </div>
    )
  }
}

export class Queue extends Component {
  state = {
    collapsed: false
  }

  toggleCollapsed = () => {
    this.setState(state => ({ collapsed: !state.collapsed }))
  }

  render() {
    const { t, visible = false, queue = [], purgeQueue } = this.props
    const { collapsed } = this.state
    const doneCount = queue.filter(
      connection => connection.status !== 'ongoing'
    ).length
    const successCount = queue.filter(
      connection => connection.status === 'done'
    ).length
    return (
      <div
        className={classNames(styles['queue'], {
          [styles['queue--visible']]: visible,
          [styles['queue--collapsed']]: collapsed
        })}
      >
        <h4
          className={styles['queue-header']}
          onDoubleClick={this.toggleCollapsed}
        >
          {doneCount < queue.length && (
            <div className={styles['queue-header-inner']}>
              <span className="coz-desktop">{t('Queue.header')}</span>
              <span className="coz-mobile">
                {t('Queue.header_mobile', {
                  done: doneCount,
                  total: queue.length
                })}
              </span>
            </div>
          )}
          {doneCount >= queue.length && (
            <div className={styles['queue-header-inner']}>
              <span>
                {t('Queue.header_done', {
                  done: successCount,
                  total: queue.length
                })}
              </span>
              <button
                className={classNames(styles['btn-close'])}
                onClick={purgeQueue}
              >
                {t('Queue.close')}
              </button>
            </div>
          )}
        </h4>
        <progress
          className={styles['queue-progress']}
          value={doneCount}
          max={queue.length}
        />
        <div className={styles['queue-content']}>
          <div className={styles['queue-list']}>
            {queue.map(item => (
              <Item
                key={item.triggerId}
                konnector={item.konnector}
                label={item.label}
                status={item.status}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(Queue)
