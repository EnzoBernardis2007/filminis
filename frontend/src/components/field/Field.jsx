import {
  createContext,
  useContext,
  forwardRef
} from "react"

import styles from "./field.module.css"

const FieldContext = createContext(null)
const FieldGroupContext = createContext(null)

export const Field = forwardRef(function Field(
    {
        children,
        disabled = false,
        required = false,
        invalid = false,
        readOnly = false,
        orientation = "vertical",
        className,
        style,
        ...props
    },
    ref
) {
    const value = {
        disabled,
        required,
        invalid,
        readOnly,
        orientation
    }

    return (
        <FieldContext.Provider value={value}>
            <div
                ref={ref}
                className={className}
                style={style}
                {...props}
            >
                {children}
            </div>
        </FieldContext.Provider>
    )
})

export const FieldLabel = forwardRef(function FieldLabel(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    const field = useContext(FieldContext)

    return (
        <label
            ref={ref}
            className={className}
            style={style}
            data-disabled={field?.disabled}
            data-required={field?.required}
            data-invalid={field?.invalid}
            {...props}
        >
            {children}
        </label>
    )
})

export const FieldContent = forwardRef(function FieldContent(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    const field = useContext(FieldContext)

    return (
        <div
            ref={ref}
            className={className}
            style={style}
            data-orientation={field?.orientation}
            {...props}
        >
            {children}
        </div>
    )
})

export const FieldDescription = forwardRef(function FieldDescription(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    const field = useContext(FieldContext)

    return (
        <p
            ref={ref}
            className={className}
            style={style}
            data-disabled={field?.disabled}
            {...props}
        >
            {children}
        </p>
    )
})

export const FieldHint = forwardRef(function FieldHint(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    return (
        <p
            ref={ref}
            className={`${className} ${styles.hint}`}
            style={style}
            {...props}
        >
            {children}
        </p>
    )
})

export const FieldError = forwardRef(function FieldError(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    const field = useContext(FieldContext)

    if (!field?.invalid && !children) {
        return null
    }

    return (
        <p
            ref={ref}
            className={className}
            style={style}
            data-invalid={field?.invalid}
            {...props}
        >
            {children}
        </p>
    )
})

export const FieldGroup = forwardRef(function FieldGroup(
    {
        children,
        disabled,
        required,
        invalid,
        readOnly,
        orientation = "horizontal",
        className,
        style,
        ...props
    },
    ref
) {
    const field = useContext(FieldContext)

    const value = {
        disabled: disabled ?? field?.disabled ?? false,
        required: required ?? field?.required ?? false,
        invalid: invalid ?? field?.invalid ?? false,
        readOnly: readOnly ?? field?.readOnly ?? false,
        orientation
    }

    return (
        <FieldGroupContext.Provider value={value}>
            <div
                ref={ref}
                className={className}
                style={style}
                data-orientation={orientation}
                {...props}
            >
                {children}
            </div>
        </FieldGroupContext.Provider>
    )
})

export const FieldAddon = forwardRef(function FieldAddon(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    const group = useContext(FieldGroupContext)

    return (
        <div
            ref={ref}
            className={className}
            style={style}
            data-disabled={group?.disabled}
            data-invalid={group?.invalid}
            {...props}
        >
            {children}
        </div>
    )
})

export const FieldIcon = forwardRef(function FieldIcon(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    const group = useContext(FieldGroupContext)

    return (
        <span
            ref={ref}
            className={className}
            style={style}
            data-disabled={group?.disabled}
            data-invalid={group?.invalid}
            {...props}
        >
            {children}
        </span>
    )
})

export const FieldAction = forwardRef(function FieldAction(
    {
        children,
        className,
        style,
        ...props
    },
    ref
) {
    const group = useContext(FieldGroupContext)

    return (
        <div
            ref={ref}
            className={className}
            style={style}
            data-disabled={group?.disabled}
            data-invalid={group?.invalid}
            {...props}
        >
            {children}
        </div>
    )
})

export function useField() {
    return useContext(FieldContext)
}

export function useFieldGroup() {
    return useContext(FieldGroupContext)
}