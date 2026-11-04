import {
    forwardRef
} from "react"
import styles from './input.module.css'

import { useField } from "../field/Field"

const Input = forwardRef(function Input(
    {
        type = "text",
        name,
        required,
        minLength,
        maxLength,
        min,
        max,
        step,
        pattern,
        form,
        disabled,
        loading = false,
        placeholder,
        readOnly,
        value,
        defaultValue,
        autoComplete = "off",
        autoCorrect = "off",
        spellCheck = false,
        onChange,
        onBlur,
        onFocus,
        className,
        style,
        fullWidth = false,
        ...props
    },
    ref
) {
    const field = useField()

    const isDisabled = disabled ?? field?.disabled
    const isRequired = required ?? field?.required
    const isReadOnly = readOnly ?? field?.readOnly
    const isInvalid = field?.invalid

    return (
        <input
            ref={ref}
            type={type}
            name={name}
            required={isRequired}
            minLength={minLength}
            maxLength={maxLength}
            min={min}
            max={max}
            step={step}
            pattern={pattern}
            form={form}
            disabled={isDisabled || loading}
            placeholder={placeholder}
            readOnly={isReadOnly}
            value={value}
            defaultValue={defaultValue}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            spellCheck={spellCheck}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            className={`${className} ${styles.input} ${fullWidth ? styles.fullWidth : ""}`}
            style={style}
            data-disabled={isDisabled || loading}
            data-required={isRequired}
            data-invalid={isInvalid}
            data-readonly={isReadOnly}
            data-loading={loading}
            {...props}
        />
    )
})

export default Input