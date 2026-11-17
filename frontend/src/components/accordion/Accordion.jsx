import {
    createContext,
    useContext,
    useMemo,
    useState
} from "react"
import styles from "./accordion.module.css"

const AccordionContext = createContext(null)
const AccordionItemContext = createContext(null)

export function Accordion({
    children,
    type = "single",
    value,
    defaultValue,
    onValueChange,
    collapsible = true,
    readOnly = false,
    className,
    style
}) {
    const isControlled = value !== undefined

    const [internalValue, setInternalValue] = useState(() => {
        if (defaultValue !== undefined) {
            return defaultValue
        }

        return type === "multiple"
            ? []
            : null
    })

    const currentValue = isControlled
        ? value
        : internalValue

    function updateValue(nextValue) {
        if (!isControlled) {
            setInternalValue(nextValue)
        }

        onValueChange?.(nextValue)
    }

    function isItemOpen(itemValue) {
        if (type === "multiple") {
            return currentValue?.includes(itemValue)
        }

        return currentValue === itemValue
    }

    function toggleItem(itemValue) {
        if (readOnly) {
            return
        }

        if (type === "multiple") {
            const values = Array.isArray(currentValue)
                ? currentValue
                : []

            const exists = values.includes(itemValue)

            const nextValue = exists
                ? values.filter(v => v !== itemValue)
                : [...values, itemValue]

            updateValue(nextValue)

            return
        }

        const isOpen = currentValue === itemValue

        if (isOpen) {
            if (!collapsible) {
                return
            }

            updateValue(null)
            return
        }

        updateValue(itemValue)
    }

    const contextValue = useMemo(
        () => ({
            type,
            value: currentValue,
            toggleItem,
            isItemOpen,
            collapsible,
            readOnly
        }),
        [
            type,
            currentValue,
            collapsible,
            readOnly
        ]
    )

    return (
        <AccordionContext.Provider value={contextValue}>
            <div
                className={`${styles.accordion} ${styles[type]} ${readOnly ? styles.readOnly : ""} ${className || ""}`}
                style={style}
                data-type={type}
                data-read-only={readOnly}
            >
                {children}
            </div>
        </AccordionContext.Provider>
    )
}

export function AccordionItem({
    children,
    value,
    disabled = false,
    onOpen,
    onClose,
    onToggle,
    className,
    style
}) {
    const accordion = useContext(AccordionContext)

    const open = accordion.isItemOpen(value)

    const contextValue = useMemo(
        () => ({
            value,
            disabled,
            open,
            onOpen,
            onClose,
            onToggle
        }),
        [
            value,
            disabled,
            open,
            onOpen,
            onClose,
            onToggle
        ]
    )

    return (
        <AccordionItemContext.Provider value={contextValue}>
            <div
                className={`${styles.accordionItem} ${className || ""}`}
                style={style}
                data-value={value}
                data-open={open}
                data-disabled={disabled}
            >
                {children}
            </div>
        </AccordionItemContext.Provider>
    )
}

export function AccordionTrigger({
    children,
    onClick,
    className,
    style
}) {
    const accordion = useContext(AccordionContext)
    const item = useContext(AccordionItemContext)

    function handleClick(event) {
        if (item.disabled) {
            return
        }

        const wasOpen = item.open

        accordion.toggleItem(item.value)

        const nowOpen = !wasOpen

        if (nowOpen) {
            item.onOpen?.()
        } else {
            item.onClose?.()
        }

        item.onToggle?.(nowOpen)

        onClick?.(event)
    }

    return (
        <button
            type="button"
            className={`${styles.accordionTrigger} ${className || ""}`}
            style={style}
            onClick={handleClick}
            disabled={item.disabled}
            aria-expanded={item.open}
            aria-controls={`accordion-content-${item.value}`}
            id={`accordion-trigger-${item.value}`}
        >
            <span className={styles.triggerContent}>
                {children}
            </span>
            <svg
                className={`${styles.triggerIcon} ${item.open ? styles.triggerIconOpen : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </button>
    )
}

export function AccordionContent({
    children,
    forceMount = false,
    className,
    style
}) {
    const item = useContext(AccordionItemContext)

    if (!item.open && !forceMount) {
        return null
    }

    return (
        <div
            id={`accordion-content-${item.value}`}
            role="region"
            aria-labelledby={`accordion-trigger-${item.value}`}
            className={`${styles.accordionContent} ${className || ""}`}
            style={style}
            data-closed={!item.open}
        >
            {children}
        </div>
    )
}