import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useRef,
    useEffect,
    useCallback
} from "react"

import styles from "./combobox.module.css"

const ComboboxContext = createContext(null)

function Combobox({
    children,
    options = [],
    value,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    searchValue,
    onSearchChange,
    placeholder = "Buscar...",
    disabled = false,
    loading = false,
    clearable = false,
    className,
    style,
    // New prop: when true, the search input acts as the trigger (autocomplete mode)
    autocomplete = true
}) {
    const [internalValue, setInternalValue] =
        useState(defaultValue)

    const [internalOpen, setInternalOpen] =
        useState(defaultOpen)

    const [internalSearch, setInternalSearch] =
        useState("")

    const currentValue =
        value !== undefined
            ? value
            : internalValue

    const currentOpen =
        open !== undefined
            ? open
            : internalOpen

    const currentSearch =
        searchValue !== undefined
            ? searchValue
            : internalSearch

    const setValue = (nextValue) => {
        if (value === undefined) {
            setInternalValue(nextValue)
        }

        onValueChange?.(nextValue)
    }

    const setOpen = (nextOpen) => {
        if (open === undefined) {
            setInternalOpen(nextOpen)
        }

        onOpenChange?.(nextOpen)
    }

    const setSearch = (nextSearch) => {
        if (searchValue === undefined) {
            setInternalSearch(nextSearch)
        }

        onSearchChange?.(nextSearch)
    }

    const selectedOption = options.find(
        (option) => option.value === currentValue
    )

    const filteredOptions = useMemo(() => {
        const query = currentSearch.trim()

        if (!query) {
            return options
        }

        return options.filter((option) =>
            option.label
                .toLowerCase()
                .includes(query.toLowerCase())
        )
    }, [options, currentSearch])

    const contextValue = {
        options,
        filteredOptions,

        value: currentValue,
        setValue,

        search: currentSearch,
        setSearch,

        open: currentOpen,
        setOpen,

        placeholder,
        disabled,
        loading,
        clearable,
        autocomplete,

        selectedOption
    }

    return (
        <ComboboxContext.Provider value={contextValue}>
            <div
                className={className}
                style={style}
            >
                {children}
            </div>
        </ComboboxContext.Provider>
    )
}

function useCombobox() {
    const context = useContext(ComboboxContext)

    if (!context) {
        throw new Error(
            "Combobox components must be used inside Combobox."
        )
    }

    return context
}

// In autocomplete mode, the trigger IS the search input
function ComboboxTrigger({
    className,
    style,
    // Allow customizing the input element
    inputProps = {}
}) {
    const {
        open,
        setOpen,
        disabled,
        loading,
        placeholder,
        selectedOption,
        search,
        setSearch,
        setValue,
        clearable,
        autocomplete
    } = useCombobox()

    const isDisabled = disabled || loading
    const inputRef = useRef(null)
    const wrapperRef = useRef(null)

    // Handle click outside to close dropdown
    useEffect(() => {
        if (!open) return

        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open, setOpen])

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event) => {
        if (!open) return

        switch (event.key) {
            case "Escape":
                setOpen(false)
                inputRef.current?.blur()
                break
            case "Tab":
                setOpen(false)
                break
        }
    }, [open, setOpen])

    // When in autocomplete mode, the trigger is an input
    if (autocomplete) {
        const triggerClassName = [
            styles.triggerWrapper,
            open && styles.triggerWrapperOpen,
            isDisabled && styles.triggerWrapperDisabled,
            className
        ].filter(Boolean).join(" ")

        // Show selected option label when selected and not actively searching
        // If user is typing (search has content), show what they're typing
        // If there's a selection but no search text, show the selected label
        const displayValue = search ? search : (selectedOption?.label || "")

        // Determine if we should show the "has value" state
        // This is when there's a selected option but user isn't actively typing
        const hasSelectedValue = selectedOption && !search

        return (
            <div
                ref={wrapperRef}
                className={triggerClassName}
                style={style}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    disabled={isDisabled}
                    placeholder={placeholder}
                    className={`${styles.triggerInput} ${hasSelectedValue ? styles.triggerInputHasValue : ""}`}
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        const newSearch = event.target.value
                        setSearch(newSearch)
                        setOpen(true)
                        // If user modifies the search after selecting an option, clear the selection
                        // so they can search for a different option
                        if (currentValue !== undefined && currentValue !== null) {
                            setValue(null)
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    {...inputProps}
                />
                {clearable && (search || selectedOption) && (
                    <button
                        type="button"
                        className={styles.clear}
                        onClick={(e) => {
                            e.stopPropagation()
                            setValue(null)
                            setSearch("")
                            setOpen(false)
                            inputRef.current?.focus()
                        }}
                        aria-label="Limpar seleção"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
                <svg
                    className={`${styles.triggerIcon} ${open ? styles.triggerIconOpen : ""}`}
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
            </div>
        )
    }

    // Legacy mode: button trigger (for backward compatibility)
    const triggerClassName = [
        styles.trigger,
        className
    ].filter(Boolean).join(" ")

    const displayText = selectedOption?.label || placeholder
    const isPlaceholder = !selectedOption

    return (
        <button
            type="button"
            disabled={isDisabled}
            className={triggerClassName}
            style={style}
            onClick={() => setOpen(!open)}
            data-open={open}
            data-disabled={isDisabled}
        >
            <span className={`${styles.triggerText} ${isPlaceholder ? styles.triggerPlaceholder : ""}`}>
                {displayText}
            </span>
            <svg
                className={styles.triggerIcon}
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

function ComboboxContent({
    children,
    className,
    style
}) {
    const { open } = useCombobox()

    if (!open) {
        return null
    }

    const contentRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contentRef.current && !contentRef.current.contains(event.target)) {
                // Content handles its own click outside via wrapper
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div
            ref={contentRef}
            className={`${styles.content} ${className || ""}`}
            style={style}
            role="listbox"
        >
            {children}
        </div>
    )
}

// Standalone search input (for legacy mode where search is inside content)
function ComboboxSearch({
    className,
    style,
    placeholder
}) {
    const {
        search,
        setSearch,
        setOpen,
        disabled
    } = useCombobox()

    return (
        <input
            type="text"
            value={search}
            disabled={disabled}
            placeholder={placeholder}
            className={`${styles.search} ${className || ""}`}
            style={style}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
                setSearch(event.target.value)
                setOpen(true)
            }}
            aria-label="Buscar opções"
            aria-autocomplete="list"
        />
    )
}

function ComboboxList({
    children,
    className,
    style
}) {
    const { filteredOptions, value, search } = useCombobox()

    // Check if we should show empty state
    // Show when there are no filtered options AND user has typed something
    const showEmptyState = filteredOptions.length === 0 && search.trim() !== ""

    return (
        <div
            className={`${styles.list} ${className || ""}`}
            style={style}
            role="presentation"
        >
            {children ??
                (showEmptyState ? (
                    <div className={styles.emptyState}>
                        Nenhum resultado encontrado para "{search}"
                    </div>
                ) : (
                    filteredOptions.map((option) => (
                        <ComboboxOption
                            key={option.value}
                            value={option.value}
                            label={option.label}
                            isSelected={option.value === value}
                        >
                            {option.label}
                        </ComboboxOption>
                    ))
                ))}
        </div>
    )
}

function ComboboxOption({
    value,
    children,
    className,
    style,
    isSelected = false
}) {
    const {
        setValue,
        setSearch,
        setOpen,
        disabled
    } = useCombobox()

    const optionDisabled = disabled

    const optionClassName = [
        styles.option,
        isSelected && styles.optionSelected,
        className
    ].filter(Boolean).join(" ")

    // Use onMouseDown instead of onClick to ensure selection happens
    // before the click-outside handler closes the dropdown
    const handleMouseDown = (event) => {
        if (!optionDisabled) {
            // Prevent the input from losing focus and stop the click-outside handler
            event.preventDefault()
            setValue(value)
            setSearch("")
            setOpen(false)
        }
    }

    return (
        <button
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={optionDisabled}
            className={optionClassName}
            style={style}
            onMouseDown={handleMouseDown}
            data-highlighted={false}
            data-value={value}
        >
            {children}
        </button>
    )
}

function ComboboxClear({
    children = "Limpar",
    className,
    style
}) {
    const {
        clearable,
        setValue,
        setSearch
    } = useCombobox()

    if (!clearable) {
        return null
    }

    return (
        <button
            type="button"
            className={`${styles.clear} ${className || ""}`}
            style={style}
            onClick={() => {
                setValue(null)
                setSearch("")
            }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {children}
        </button>
    )
}

export {
    Combobox,
    ComboboxTrigger,
    ComboboxContent,
    ComboboxSearch,
    ComboboxList,
    ComboboxOption,
    ComboboxClear
}