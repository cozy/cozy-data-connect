import styles from '../styles/field.styl'

import React, { Component, cloneElement } from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import { translate } from 'cozy-ui/react/I18n'
import statefulComponent from '../lib/statefulComponent'

const Field = props => {
  let inputs
  if (props.children && props.children.length !== 0) {
    inputs = React.Children.toArray(props.children).map(child =>
      cloneElement(
        child,
        Object.assign(props, {
          selected: props.value,
          className: styles['coz-field-input']
        })
      )
    )
  } else {
    const {
      type,
      placeholder,
      connectorSlug,
      value,
      pattern,
      onChange,
      onBlur,
      onInput,
      disabled,
      readOnly,
      name
    } = props
    inputs = (
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={`${connectorSlug} ${name}`}
        className={styles['coz-field-input']}
        readOnly={readOnly}
        disabled={disabled || readOnly}
        value={value}
        name={name}
        pattern={pattern || false}
        onChange={onChange}
        onBlur={onBlur}
        onInput={onInput}
      />
    )
  }
  const { giveFocus } = props
  return props.type === 'hidden' ? (
    inputs
  ) : (
    <FieldWrapper giveFocus={props.type !== 'hidden' && giveFocus} {...props}>
      {inputs}
    </FieldWrapper>
  )
}

export default Field

export class FieldWrapper extends Component {
  componentDidMount() {
    if (this.props.giveFocus)
      ReactDOM.findDOMNode(this)
        .querySelector('input')
        .focus()
  }

  render() {
    const { label, invalid, errors, children } = this.props
    const hasErrored = errors.length !== 0 || invalid

    return (
      <div
        className={classNames(
          styles['coz-field'],
          hasErrored && styles['coz-field--error']
        )}
      >
        {label && <label>{label}</label>}
        {children}
        {errors.length !== 0 &&
          errors.map((err, i) => (
            <p key={i} className={styles['coz-field-error']}>
              {err}
            </p>
          ))}
      </div>
    )
  }
}

export const PasswordField = translate()(
  statefulComponent(
    {
      visible: false
    },
    setState => ({
      toggleVisibility: () => {
        setState(state => ({ visible: !state.visible }))
      }
    })
  )(props => {
    const {
      t,
      connectorSlug,
      placeholder,
      value,
      onChange,
      onBlur,
      onInput,
      pattern,
      toggleVisibility,
      visible,
      name,
      giveFocus
    } = props
    return (
      <FieldWrapper giveFocus={props.type !== 'hidden' && giveFocus} {...props}>
        <button
          type="button"
          tabIndex="-1"
          title={
            visible
              ? t('field.password.visibility.title.hide')
              : t('field.password.visibility.title.show')
          }
          className={styles['password-visibility']}
          onClick={() => toggleVisibility()}
        >
          {visible
            ? t('field.password.visibility.hide')
            : t('field.password.visibility.show')}
        </button>
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={`${connectorSlug} password`}
          placeholder={placeholder}
          className={styles['coz-field-input']}
          value={value}
          name={name}
          pattern={pattern || false}
          onChange={onChange}
          onInput={onInput}
          onBlur={onBlur}
        />
      </FieldWrapper>
    )
  })
)

export const DropdownField = translate()(props => {
  const { value, options, onChange, onInput } = props
  let valueInOptions = options.indexOf(value) !== -1
  let dropdownFieldOptions = valueInOptions ? options : [value].concat(options)

  return (
    <FieldWrapper {...props}>
      <select
        className={styles['coz-field-dropdown']}
        value={value}
        onChange={onChange}
        onInput={onInput}
      >
        {dropdownFieldOptions.map(optionValue => (
          <option
            value={optionValue.value}
            selected={optionValue.value === { value }}
          >
            {optionValue.name}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
})

class FolderPickerFieldComponent extends Component {
  constructor(props, context) {
    super(props)
    this.store = context.store
    this.state = { isFetching: true, foldersList: [{ path: props.value }] }
    this.store.fetchFolders().then(folders => {
      const foldersList = folders.find(f => f.path === props.value)
        ? folders
        : [{ path: props.value }].concat(folders)
      this.setState({
        isFetching: false,
        foldersList
      })
    })
  }

  render() {
    const { value, onChange, onInput, readOnly } = this.props
    const { isFetching, foldersList } = this.state
    return (
      <FieldWrapper {...this.props}>
        <select
          className={styles['coz-field-dropdown']}
          value={isFetching ? 'loading' : value}
          onChange={onChange}
          onInput={onInput}
          aria-busy={isFetching}
          disabled={readOnly || isFetching}
        >
          {foldersList.map(folder => (
            <option value={folder.path} selected={folder.path === value}>
              {folder.path}
            </option>
          ))}
        </select>
      </FieldWrapper>
    )
  }
}
export const FolderPickerField = translate()(FolderPickerFieldComponent)

export const CheckboxField = translate()(props => {
  const { value, onChange, onInput, label, errors } = props
  let input = (
    <input
      type="checkbox"
      className={styles['coz-field-input-checkbox']}
      value={value}
      checked={value}
      onChange={onChange}
      onInput={onInput}
    />
  )

  const hasErrored = errors.length > 0

  return (
    <div
      className={classNames(
        styles['coz-field'],
        hasErrored && styles['coz-field--error']
      )}
    >
      {label && (
        <label>
          {input} {label}
        </label>
      )}
      {errors.length !== 0 &&
        errors.map((err, i) => (
          <p key={i} className={styles['coz-field-error']}>
            {err}
          </p>
        ))}
    </div>
  )
})

export const isHidden = field =>
  (field.type && field.type === 'hidden') || field.hidden
export const isAdvanced = field => !!field.advanced
