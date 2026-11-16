
import { forwardRef, useRef, useCallback, useEffect } from "react"
import styles from "./button.module.css"

const Button = forwardRef(function Button(
    {
        children,
        type = "button",
        form,
        disabled = false,
        loading = false,
        as: Component = "button",
        href,
        target,
        name,
        debounce = 0,
        variant = "primary",
        icon: Icon,
        iconPosition = "left",
        onClick,
        className,
        fullWidth = false,
        ...props
    },
    ref
) {
    const timeoutRef = useRef(null)

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const handleClick = useCallback((e) => {
        if (disabled || loading) {
            e.preventDefault()
            return
        }

        if (debounce > 0) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                onClick?.(e)
            }, debounce)

            return
        }

        onClick?.(e)
    }, [disabled, loading, debounce, onClick])

    const variantClass = styles[variant] ?? styles.primary

    const buttonClassName = [
        styles.button,
        variantClass,
        fullWidth && styles.fullWidth,
        className
    ].filter(Boolean).join(" ")

    return (
        <Component
            ref={ref}
            type={Component === "button" ? type : undefined}
            form={form}
            href={href}
            target={target}
            name={name}
            disabled={
                Component === "button"
                    ? disabled || loading
                    : undefined
            }
            aria-disabled={
                Component !== "button" && (disabled || loading)
                    ? true
                    : undefined
            }
            aria-busy={loading || undefined}
            onClick={handleClick}
            className={buttonClassName}
            {...props}
        >
            {Icon && iconPosition === "left" && (
                <Icon className={styles.icon} aria-hidden="true" />
            )}

            {children}

            {Icon && iconPosition === "right" && (
                <Icon className={styles.icon} aria-hidden="true" />
            )}
        </Component>
    )
})

export default Button
