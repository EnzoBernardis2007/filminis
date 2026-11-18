import {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import styles from "./combobox.module.css";

const ComboboxContext = createContext(null);

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
  autocomplete = true,
  multiple = false,
}) {
  // Initialize default value as array if multiple, otherwise single value
  const getInitialValue = () => {
    if (multiple) {
      return Array.isArray(defaultValue)
        ? defaultValue
        : defaultValue
        ? [defaultValue]
        : [];
    }
    return defaultValue;
  };

  const [internalValue, setInternalValue] = useState(getInitialValue);

  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const [internalSearch, setInternalSearch] = useState("");

  const currentValue = value !== undefined ? value : internalValue;

  const currentOpen = open !== undefined ? open : internalOpen;

  const currentSearch =
    searchValue !== undefined ? searchValue : internalSearch;

  const setValue = useCallback(
    (nextValue) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [value, onValueChange],
  );

  const setOpen = useCallback(
    (nextOpen) => {
      if (open === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [open, onOpenChange],
  );

  const setSearch = useCallback(
    (nextSearch) => {
      if (searchValue === undefined) {
        setInternalSearch(nextSearch);
      }
      onSearchChange?.(nextSearch);
    },
    [searchValue, onSearchChange],
  );

  // Helper to check if an option is selected
  const isOptionSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(currentValue) && currentValue.includes(optionValue);
    }
    return currentValue === optionValue;
  };

  // Get all selected options
  const selectedOptions = useMemo(() => {
    if (multiple) {
      return Array.isArray(currentValue)
        ? currentValue
            .map((v) => options.find((opt) => opt.value === v))
            .filter(Boolean)
        : [];
    }
    return currentValue
      ? [options.find((opt) => opt.value === currentValue)].filter(Boolean)
      : [];
  }, [currentValue, options, multiple]);

  // For backward compatibility - single selected option
  const selectedOption = selectedOptions[0] || null;

  const filteredOptions = useMemo(() => {
    const query = currentSearch.trim().toLowerCase();

    if (!query) {
      return options;
    }

    // Score each option based on relevance
    // 3 = starts with query (highest priority)
    // 2 = contains query as word boundary
    // 1 = contains query anywhere
    // 0 = fuzzy match (subsequence - characters in order but not necessarily consecutive)
    const scoredOptions = options.map((option) => {
      const label = option.label.toLowerCase();
      let score = 0;

      // Exact prefix match (starts with)
      if (label.startsWith(query)) {
        score = 3;
      }
      // Word boundary match (query appears after space, hyphen, underscore)
      else if (new RegExp(`(^|[\\s\\-_])${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`).test(label)) {
        score = 2;
      }
      // Contains match
      else if (label.includes(query)) {
        score = 1;
      }
      // Fuzzy match: check if query characters appear in order (subsequence)
      else {
        let labelIdx = 0;
        let queryIdx = 0;
        while (labelIdx < label.length && queryIdx < query.length) {
          if (label[labelIdx] === query[queryIdx]) {
            queryIdx++;
          }
          labelIdx++;
        }
        if (queryIdx === query.length) {
          score = 0.5; // Fuzzy match gets lower score
        }
      }

      return { option, score };
    });

    // Filter out non-matches (score 0) and sort by score descending
    // For ties, maintain original order (stable sort by using original index)
    return scoredOptions
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || options.indexOf(a.option) - options.indexOf(b.option))
      .map(({ option }) => option);
  }, [options, currentSearch]);

  // Toggle option selection (for multiple mode)
  const toggleOption = useCallback(
    (optionValue) => {
      if (multiple) {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        const isSelected = currentArray.includes(optionValue);
        const newValue = isSelected
          ? currentArray.filter((v) => v !== optionValue)
          : [...currentArray, optionValue];
        setValue(newValue);
      } else {
        setValue(optionValue);
      }
    },
    [currentValue, multiple, setValue],
  );

  // Clear all selections
  const clearAll = useCallback(() => {
    setValue(multiple ? [] : null);
    setSearch("");
  }, [multiple, setValue, setSearch]);

  const contextValue = {
    options,
    filteredOptions,
    multiple,

    value: currentValue,
    setValue,
    toggleOption,
    clearAll,

    selectedOptions,
    selectedOption,
    isOptionSelected,

    search: currentSearch,
    setSearch,

    open: currentOpen,
    setOpen,

    placeholder,
    disabled,
    loading,
    clearable,
    autocomplete,
  };

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div className={styles.bigWrapper}>
        {/* Selected chips/tags for multiple mode */}
        {multiple && selectedOptions.length > 0 && (
          <div
            className={styles.selectedChipsAnother}
            aria-label="Opções selecionadas"
          >
            {selectedOptions.map((option) => (
              <span key={option.value} className={styles.chipAnother}>
                {option.label}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleOption(option.value);
                  }}
                  aria-label={`Remover ${option.label}`}
                  tabIndex={-1}
                >
                  <svg
                    width="24"
                    height="24"
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
              </span>
            ))}
          </div>
        )}
        <div className={className} style={style}>
          {children}
        </div>
      </div>
    </ComboboxContext.Provider>
  );
}

function useCombobox() {
  const context = useContext(ComboboxContext);

  if (!context) {
    throw new Error("Combobox components must be used inside Combobox.");
  }

  return context;
}

// In autocomplete mode, the trigger IS the search input
function ComboboxTrigger({
  className,
  style,
  children,
  // Allow customizing the input element
  inputProps = {},
}) {
  const {
    open,
    setOpen,
    disabled,
    loading,
    placeholder,
    selectedOptions,
    selectedOption,
    search,
    setSearch,
    setValue,
    clearAll,
    clearable,
    autocomplete,
    value,
    multiple,
  } = useCombobox();

  const isDisabled = disabled || loading;
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event) => {
      if (!open) return;

      switch (event.key) {
        case "Escape":
          setOpen(false);
          inputRef.current?.blur();
          break;
        case "Tab":
          setOpen(false);
          break;
      }
    },
    [open, setOpen],
  );

  // When in autocomplete mode
  if (autocomplete) {
    const triggerClassName = [
      styles.triggerWrapper,
      open && styles.triggerWrapperOpen,
      isDisabled && styles.triggerWrapperDisabled,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Single select mode with selection: show selected value in input (readonly)
    const isSingleModeWithSelection = !multiple && selectedOption;

    // Determine input value and behavior
    const isInputReadOnly = isSingleModeWithSelection && !search;
    const inputValue = isInputReadOnly ? selectedOption.label : (search ? search : "");
    const inputPlaceholder = isInputReadOnly ? "" : placeholder;

    return (
      <div ref={wrapperRef} className={triggerClassName} style={style}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={isDisabled}
          readOnly={isInputReadOnly}
          placeholder={inputPlaceholder}
          className={`${styles.triggerInput} ${
            isInputReadOnly ? styles.triggerInputReadOnly : ""
          } ${multiple ? styles.triggerInputMultiple : ""}`}
          onFocus={() => {
            if (isInputReadOnly) {
              // Don't open on focus when readonly - user clicks to clear
              return;
            }
            setOpen(true);
          }}
          onClick={(e) => {
            if (isInputReadOnly) {
              // Clicking readonly input opens dropdown for new search
              e.target.readOnly = false;
              setSearch("");
              setOpen(true);
            }
          }}
          onChange={(event) => {
            // Prevent typing when readonly
            if (isInputReadOnly) return;
            const newSearch = event.target.value;
            setSearch(newSearch);
            setOpen(true);
            // If user clears the search completely after selecting an option, deselect it
            if (
              newSearch.trim() === "" &&
              value !== undefined &&
              value !== null &&
              !multiple
            ) {
              setValue(null);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-multiselectable={multiple}
          {...inputProps}
        />
        {clearable && isSingleModeWithSelection && !search && (
          <button
            type="button"
            className={styles.clear}
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
              setOpen(true);
              // Focus input after clear so user can type new search
              setTimeout(() => inputRef.current?.focus(), 0);
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
        {clearable && (search && !multiple ) && (
          <button
            type="button"
            className={styles.clear}
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label={
              multiple ? "Limpar todas as seleções" : "Limpar seleção"
            }
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
          className={`${styles.triggerIcon} ${
            open ? styles.triggerIconOpen : ""
          }`}
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
        {open && children && children}
      </div>
    );
  }

  // Legacy mode: button trigger (for backward compatibility)
  const triggerClassName = [styles.trigger, className]
    .filter(Boolean)
    .join(" ");

  const displayText = multiple
    ? selectedOptions.length > 0
      ? `${selectedOptions.length} selecionado${
          selectedOptions.length > 1 ? "s" : ""
        }`
      : placeholder
    : selectedOption?.label || placeholder;
  const isPlaceholder = multiple
    ? selectedOptions.length === 0
    : !selectedOption;

  // Wrap button and dropdown in a relative positioned container
  const wrapperClassName = [
    styles.triggerWrapper,
    open && styles.triggerWrapperOpen,
    isDisabled && styles.triggerWrapperDisabled,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={wrapperRef} className={wrapperClassName} style={style}>
      <button
        type="button"
        disabled={isDisabled}
        className={triggerClassName}
        onClick={() => setOpen(!open)}
        data-open={open}
        data-disabled={isDisabled}
      >
        <span
          className={`${styles.triggerText} ${
            isPlaceholder ? styles.triggerPlaceholder : ""
          }`}
        >
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
      {open && children && children}
    </div>
  );
}

function ComboboxContent({ children, className, style }) {
  const { multiple } = useCombobox();
  // When used as child of ComboboxTrigger, the trigger handles open state and positioning
  // This component now just provides the content styling
  return (
    <div
      className={`${styles.content} ${className || ""}`}
      style={style}
      role="listbox"
      aria-multiselectable={multiple}
    >
      {children}
    </div>
  );
}

// Standalone search input (for legacy mode where search is inside content)
function ComboboxSearch({ className, style, placeholder }) {
  const { search, setSearch, setOpen, disabled, value, setValue, multiple } =
    useCombobox();

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
        const newSearch = event.target.value;
        setSearch(newSearch);
        setOpen(true);
        // If user clears the search completely after selecting an option, deselect it
        if (
          newSearch.trim() === "" &&
          value !== undefined &&
          value !== null &&
          !multiple
        ) {
          setValue(null);
        }
      }}
      aria-label="Buscar opções"
      aria-autocomplete="list"
    />
  );
}

function ComboboxList({ children, className, style }) {
  const { filteredOptions, search, isOptionSelected } = useCombobox();

  // Check if we should show empty state
  // Show when there are no filtered options AND user has typed something
  const showEmptyState = filteredOptions.length === 0 && search.trim() !== "";

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
              isSelected={isOptionSelected(option.value)}
            >
              {option.label}
            </ComboboxOption>
          ))
        ))}
    </div>
  );
}

function ComboboxOption({
  value,
  children,
  className,
  style,
  isSelected = false,
}) {
  const { toggleOption, setSearch, setOpen, disabled, multiple } =
    useCombobox();

  const optionDisabled = disabled;

  const optionClassName = [
    styles.option,
    isSelected && styles.optionSelected,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Use onMouseDown instead of onClick to ensure selection happens
  // before the click-outside handler closes the dropdown
  const handleMouseDown = (event) => {
    if (!optionDisabled) {
      // Prevent the input from losing focus and stop the click-outside handler
      event.preventDefault();
      toggleOption(value);
      if (!multiple) {
        setSearch("");
        setOpen(false);
      }
    }
  };

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
      {multiple && isSelected && (
        <svg
          className={styles.checkIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function ComboboxClear({ children = "Limpar", className, style }) {
  const { clearable, clearAll } = useCombobox();

  if (!clearable) {
    return null;
  }

  return (
    <button
      type="button"
      className={`${styles.clear} ${className || ""}`}
      style={style}
      onClick={clearAll}
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
  );
}

export {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxSearch,
  ComboboxList,
  ComboboxOption,
  ComboboxClear,
};
