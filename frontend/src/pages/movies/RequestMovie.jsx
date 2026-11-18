import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./requestMovie.module.css";
import { Field, FieldLabel, FieldContent, FieldDescription, FieldHint, FieldError, FieldGroup, FieldIcon, FieldAction } from "../../components/field/Field";
import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxList } from "../../components/combobox/Combobox";
import { useAuth } from "../../contexts/useAuth";

/**
 * RequestMovie - Two-step form for creating a new movie
 * Step 1: Basic Information (title, image URL, year, duration, budget, synopsis)
 * Step 2: Additional Information (category, director, actors, producer, languages, countries)
 * Uses existing components: Field, Input, Combobox, Button
 * Fetches combobox options from API endpoints
 * Implements real-time validation and error handling
 */
export default function RequestMovie() {
  const { api } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Step 1: Basic Information form state
  const [basicForm, setBasicForm] = useState({
    imagem: "",
    titulo: "",
    ano: "",
    duracao: "",
    orcamento: "",
    sinopse: "",
  });

  // Step 2: Additional Information form state (arrays for multiple selection)
  const [additionalForm, setAdditionalForm] = useState({
    categoria_id: [],
    diretor_id: [],
    atores_ids: [],
    produtora_id: [],
    linguagem_id: [],
    pais_origem_id: [],
  });

  // Validation errors for each field
  const [errors, setErrors] = useState({});

  // Loading states for combobox options
  const [loadingOptions, setLoadingOptions] = useState({
    categories: false,
    directors: false,
    actors: false,
    producers: false,
    languages: false,
    countries: false,
  });

  // Combobox options fetched from API
  const [options, setOptions] = useState({
    categories: [],
    directors: [],
    actors: [],
    producers: [],
    languages: [],
    countries: [],
  });

  // Error states for option loading
  const [optionErrors, setOptionErrors] = useState({});

  // Step configuration
  const steps = useMemo(() => [
    {
      id: 1,
      title: "Informações Básicas",
      description: "Informações Básicas",
    },
    {
      id: 2,
      title: "Informações Adicionais",
      description: "Informações Adicionais",
    },
  ], []);

  /**
   * Fetch all combobox options from API
   * Called on component mount
   */
  const fetchAllOptions = useCallback(async () => {
    const optionConfigs = [
      { key: 'categories', apiCall: api.categories, errorKey: 'categories' },
      { key: 'directors', apiCall: api.directors, errorKey: 'directors' },
      { key: 'actors', apiCall: api.actors, errorKey: 'actors' },
      { key: 'producers', apiCall: api.producers, errorKey: 'producers' },
      { key: 'languages', apiCall: api.languages, errorKey: 'languages' },
      { key: 'countries', apiCall: api.countries, errorKey: 'countries' },
    ];

    // Fetch all options in parallel
    await Promise.all(
      optionConfigs.map(async ({ key, apiCall, errorKey }) => {
        setLoadingOptions(prev => ({ ...prev, [key]: true }));
        setOptionErrors(prev => ({ ...prev, [errorKey]: null }));

        try {
          const data = await apiCall();
          // Transform API response to combobox format: { value, label }
          const formattedOptions = Array.isArray(data) ? data.map(item => ({
            value: item.id?.toString() || item._id?.toString() || item.id.toString(),
            label: item.nome || item.name || item.titulo || item.title || String(item)
          })) : [];
          setOptions(prev => ({ ...prev, [key]: formattedOptions }));
        } catch (error) {
          console.error(`Failed to fetch ${key}:`, error);
          setOptionErrors(prev => ({ ...prev, [errorKey]: `Erro ao carregar ${key}` }));
          setOptions(prev => ({ ...prev, [key]: [] }));
        } finally {
          setLoadingOptions(prev => ({ ...prev, [key]: false }));
        }
      })
    );
  }, [api]);

  // Fetch options on mount
  useEffect(() => {
    fetchAllOptions();
  }, [fetchAllOptions]);

  /**
   * Validate a single field
   * @param {string} name - Field name
   * @param {any} value - Field value
   * @returns {string|null} Error message or null if valid
   */
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'imagem':
        if (!value || !value.trim()) {
          return 'URL da imagem é obrigatória';
        }
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'A URL deve começar com http:// ou https://';
        }
        return null;

      case 'titulo':
        if (!value || !value.trim()) {
          return 'Título é obrigatório';
        }
        if (value.trim().length < 2) {
          return 'Título deve ter pelo menos 2 caracteres';
        }
        return null;

      case 'ano':
        if (!value || !value.trim()) {
          return 'Ano é obrigatório';
        }
        const year = parseInt(value, 10);
        if (isNaN(year) || year < 1888 || year > new Date().getFullYear() + 5) {
          return `Ano deve ser entre 1888 e ${new Date().getFullYear() + 5}`;
        }
        return null;

      case 'duracao':
        if (!value || !value.trim()) {
          return 'Duração é obrigatória';
        }
        // Accept formats: "HH:MM:SS", "HH:MM", "Xh Ymin", "Xmin", "X min", or just minutes number
        const durationStr = value.toString().trim().toLowerCase();
        const validFormats = [
          /^\d{1,2}:\d{2}(:\d{2})?$/,           // HH:MM or HH:MM:SS
          /^\d+h\s*\d*min?$/,                    // Xh Ymin
          /^\d+\s*min?$/,                        // Xmin or X min
          /^\d+$/,                               // just number (minutes)
        ];
        const isValid = validFormats.some(regex => regex.test(durationStr));
        if (!isValid) {
          return 'Formato inválido. Use: "HH:MM", "2h 30min", "120 min" ou "120"';
        }
        return null;

      case 'orcamento':
        if (!value || !value.trim()) {
          return 'Orçamento é obrigatório';
        }
        // Accept formats like "R$ 1.000.000,00", "1000000", "1,000,000"
        const budgetStr = value.toString().trim();
        const hasNumberBudget = /\d/.test(budgetStr);
        if (!hasNumberBudget) {
          return 'Orçamento deve conter valores numéricos';
        }
        return null;

      case 'sinopse':
        if (!value || !value.trim()) {
          return 'Sinopse é obrigatória';
        }
        if (value.trim().length < 20) {
          return 'Sinopse deve ter pelo menos 20 caracteres';
        }
        return null;

      // Additional info fields (arrays) - validate if at least one selected
      case 'categoria_id':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos uma categoria';
        }
        return null;

      case 'diretor_id':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um diretor';
        }
        return null;

      case 'atores_ids':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um ator';
        }
        return null;

      case 'produtora_id':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos uma produtora';
        }
        return null;

      case 'linguagem_id':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um idioma';
        }
        return null;

      case 'pais_origem_id':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um país';
        }
        return null;

      default:
        return null;
    }
  }, []);

  /**
   * Validate all fields in current step
   * @param {number} step - Step number (1 or 2)
   * @returns {boolean} True if all fields valid
   */
  const validateStep = useCallback((step) => {
    const newErrors = {};

    if (step === 1) {
      // Validate basic info fields
      Object.keys(basicForm).forEach(key => {
        const error = validateField(key, basicForm[key]);
        if (error) newErrors[key] = error;
      });
    } else if (step === 2) {
      // Validate additional info fields
      Object.keys(additionalForm).forEach(key => {
        const error = validateField(key, additionalForm[key]);
        if (error) newErrors[key] = error;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [basicForm, additionalForm, validateField]);

  /**
   * Handle input change for basic form fields
   */
  const handleBasicChange = useCallback((name, value) => {
    setBasicForm(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  /**
   * Handle combobox selection change for additional form fields
   */
  const handleAdditionalChange = useCallback((name, value) => {
    setAdditionalForm(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  /**
   * Format budget input to Brazilian currency format
   */
  const formatBudget = useCallback((value) => {
    // Remove non-numeric characters except comma and dot
    let numeric = value.replace(/[^\d.,]/g, '');
    // Handle Brazilian format: 1.000.000,00
    // For simplicity, just return the raw value and let user type
    return value;
  }, []);

  /**
   * Navigate to next step
   */
  const handleNext = useCallback(() => {
    if (validateStep(1)) {
      setCurrentStep(2);
      setSubmitError(null);
    }
  }, [validateStep]);

  /**
   * Navigate to previous step
   */
  const handleBack = useCallback(() => {
    setCurrentStep(1);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  /**
   * Convert duration string to MySQL TIME format (HH:MM:SS)
   * Accepts: "hh:MM:ss", "HH:MM", "Xh Ymin", "Xmin", "X min", "XXX" (minutes as number)
   * @param {string} durationStr - Duration input string
   * @returns {string} MySQL TIME format string (HH:MM:SS)
   */
  const parseDurationToTime = useCallback((durationStr) => {
    const str = durationStr.trim().toLowerCase();

    // Format 1: HH:MM:SS or HH:MM (already in time format)
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10).toString().padStart(2, '0');
      const minutes = timeMatch[2].padStart(2, '0');
      const seconds = (timeMatch[3] || '00').padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }

    // Format 2: "Xh Ymin" or "XhYmin" (e.g., "2h 30min", "1h30min")
    const hourMinMatch = str.match(/(\d+)h\s*(\d*)min?/);
    if (hourMinMatch) {
      const hours = parseInt(hourMinMatch[1], 10);
      const minutes = parseInt(hourMinMatch[2] || '0', 10);
      const totalMinutes = hours * 60 + minutes;
      const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const m = (totalMinutes % 60).toString().padStart(2, '0');
      return `${h}:${m}:00`;
    }

    // Format 3: "Xmin" or "X min" or just minutes number (e.g., "111min", "111 min", "111")
    const minOnlyMatch = str.match(/^(\d+)\s*min?$/);
    if (minOnlyMatch) {
      const totalMinutes = parseInt(minOnlyMatch[1], 10);
      const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const m = (totalMinutes % 60).toString().padStart(2, '0');
      return `${h}:${m}:00`;
    }

    // Fallback: try to extract any number as minutes
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      const totalMinutes = parseInt(numMatch[1], 10);
      const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const m = (totalMinutes % 60).toString().padStart(2, '0');
      return `${h}:${m}:00`;
    }

    // Default fallback
    return '00:00:00';
  }, []);

  /**
   * Submit the complete form to create a movie
   */
  const handleSubmit = useCallback(async () => {
    if (!validateStep(2)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Prepare movie data for API
      // Parse budget: remove currency symbols, convert to number
      const budgetValue = basicForm.orcamento
        .replace(/[R$\s.]/g, '')
        .replace(',', '.');
      const orcamento = parseFloat(budgetValue) || 0;

      // Parse duration to MySQL TIME format (HH:MM:SS)
      const duracao = parseDurationToTime(basicForm.duracao);

      const movieData = {
        titulo: basicForm.titulo.trim(),
        ano: parseInt(basicForm.ano, 10),
        sinopse: basicForm.sinopse.trim(),
        duracao: duracao, // MySQL TIME format: HH:MM:SS
        imagem: basicForm.imagem.trim(),
        orcamento: orcamento,
        categoria_id: additionalForm.categoria_id,
        diretor_id: additionalForm.diretor_id,
        atores_ids: additionalForm.atores_ids,
        produtora_id: additionalForm.produtora_id,
        linguagem_id: additionalForm.linguagem_id,
        pais_origem_id: additionalForm.pais_origem_id,
      };

      const response = await api.createMovie(movieData);

      setSubmitSuccess(true);
      setSubmitError(null);

      // Reset form after successful submission
      setTimeout(() => {
        setBasicForm({
          imagem: "",
          titulo: "",
          ano: "",
          duracao: "",
          orcamento: "",
          sinopse: "",
        });
        setAdditionalForm({
          categoria_id: [],
          diretor_id: [],
          atores_ids: [],
          produtora_id: [],
          linguagem_id: [],
          pais_origem_id: [],
        });
        setCurrentStep(1);
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      setSubmitError(error.message || 'Erro ao criar filme. Tente novamente.');
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [basicForm, additionalForm, api, validateStep]);

  /**
   * Render stepper/step indicator
   */
  const renderStepper = () => (
    <div className={styles.stepper} role="navigation" aria-label="Progresso do formulário">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;

        return (
          <div
            key={step.id}
            className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <div className={styles.stepNumber}>
              {isCompleted ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                String(step.id).padStart(2, "0")
              )}
            </div>

            <div className={styles.stepContent}>
              <p className={styles.stepTitle}>{step.title}</p>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  /**
   * Render a basic info field (Step 1)
   */
  const renderBasicField = ({ name, label, placeholder, type = 'text', hint, icon, pattern, inputMode }) => (
    <Field
      required
      invalid={!!errors[name]}
      className={styles.field}
    >
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <Input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={basicForm[name] || ''}
          onChange={(e) => handleBasicChange(name, e.target.value)}
          onBlur={() => validateField(name, basicForm[name])}
          pattern={pattern}
          inputMode={inputMode}
          className={styles.input}
          autoComplete="off"
        />
        {icon && (
          <FieldIcon aria-hidden="true">
            {icon}
          </FieldIcon>
        )}
      </FieldContent>
      {hint && <FieldHint>{hint}</FieldHint>}
      {errors[name] && <FieldError>{errors[name]}</FieldError>}
    </Field>
  );

  /**
   * Render a combobox field for additional info (Step 2)
   * Uses autocomplete mode (default) with inline search input
   * Shows selected tags vertically above the trigger input
   * Based on the correct component usage pattern
   */
  const renderComboboxField = ({ name, label, optionsKey, placeholder, hint, iconComponent }) => {
    const fieldOptions = options[optionsKey] || [];
    const isLoading = loadingOptions[optionsKey];
    const optionError = optionErrors[optionsKey];
    const fieldValue = additionalForm[name] || [];
    const fieldError = errors[name];

    return (
      <Field
        required
        invalid={!!fieldError}
        className={styles.field}
      >
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        <FieldContent>
          <Combobox
            id={name}
            name={name}
            value={fieldValue}
            onValueChange={(value) => handleAdditionalChange(name, value)}
            multiple
            clearable
            placeholder={placeholder}
            loading={isLoading}
            options={fieldOptions}
            autocomplete
            className={styles.combobox}
          >
            <ComboboxTrigger
              inputProps={{
                'aria-label': label,
                'aria-describedby': fieldError ? `${name}-error` : hint ? `${name}-hint` : undefined,
              }}
            >
              <ComboboxContent>
                <ComboboxList />
              </ComboboxContent>
            </ComboboxTrigger>
          </Combobox>
        </FieldContent>
        {hint && <FieldHint id={`${name}-hint`}>{hint}</FieldHint>}
        {optionError && <FieldHint style={{ color: '#FF8080' }}>{optionError}</FieldHint>}
        {fieldError && <FieldError id={`${name}-error`}>{fieldError}</FieldError>}
      </Field>
    );
  };

  /**
   * Render Step 1: Basic Information
   */
  const renderStep1 = () => (
    <div className={styles.formContainer}>
      <div className={styles.formSection}>

        {/* Image URL */}
        {renderBasicField({
          name: 'imagem',
          label: 'URL da Imagem',
          placeholder: 'https://',
          hint: 'Por enquanto apenas aceitamos o link da imagem',
          type: 'url',
          inputMode: 'url',
        })}

        {/* Title */}
        {renderBasicField({
          name: 'titulo',
          label: 'Título',
          placeholder: 'Ex: O Som do Silêncio',
        })}

        {/* Year and Duration side by side */}
        <FieldGroup className={styles.fieldGroup} orientation="horizontal">
          <Field required invalid={!!errors.ano} className={styles.field} style={{ flex: 1 }}>
            <FieldLabel htmlFor="ano">Ano</FieldLabel>
            <FieldContent>
              <Input
                id="ano"
                name="ano"
                type="text"
                placeholder="0000"
                value={basicForm.ano || ''}
                onChange={(e) => handleBasicChange('ano', e.target.value)}
                onBlur={() => validateField('ano', basicForm.ano)}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                className={styles.input}
                autoComplete="off"
              />
              <FieldIcon aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </FieldIcon>
            </FieldContent>
            {errors.ano && <FieldError>{errors.ano}</FieldError>}
          </Field>

          <Field required invalid={!!errors.duracao} className={styles.field} style={{ flex: 1 }}>
            <FieldLabel htmlFor="duracao">Duração</FieldLabel>
            <FieldContent>
              <Input
                id="duracao"
                name="duracao"
                type="text"
                placeholder="Ex: 2h 30min, 150 min, 02:30"
                value={basicForm.duracao || ''}
                onChange={(e) => handleBasicChange('duracao', e.target.value)}
                onBlur={() => validateField('duracao', basicForm.duracao)}
                className={styles.input}
                autoComplete="off"
              />
            </FieldContent>
            <FieldHint>Formatos aceitos: HH:MM, 2h 30min, 150 min, 150</FieldHint>
            {errors.duracao && <FieldError>{errors.duracao}</FieldError>}
          </Field>
        </FieldGroup>

        {/* Budget */}
        {renderBasicField({
          name: 'orcamento',
          label: 'Orçamento',
          placeholder: 'R$ 999.999.999.999',
          hint: 'Formato: R$ 1.000.000,00',
        })}

        {/* Synopsis */}
        <Field required invalid={!!errors.sinopse} className={styles.field}>
          <FieldLabel htmlFor="sinopse">Sinopse / Roteiro</FieldLabel>
          <FieldContent>
            <textarea
              id="sinopse"
              name="sinopse"
              placeholder="The quick brown fox jumps over the lazy dog. the quick brown fox jumps over the la..."
              value={basicForm.sinopse || ''}
              onChange={(e) => handleBasicChange('sinopse', e.target.value)}
              onBlur={() => validateField('sinopse', basicForm.sinopse)}
              className={styles.textarea}
              rows={6}
              autoComplete="off"
            />
          </FieldContent>
          <FieldHint>Breve descrição sobre o roteiro do filme.</FieldHint>
          {errors.sinopse && <FieldError>{errors.sinopse}</FieldError>}
        </Field>
      </div>

      {/* Navigation buttons */}
      <div className={styles.formActions}>
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={isSubmitting}
          fullWidth
        >
          Voltar
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={isSubmitting}
          fullWidth
        >
          Próximo
        </Button>
      </div>
    </div>
  );

  /**
   * Render Step 2: Additional Information
   */
  const renderStep2 = () => (
    <div className={styles.formContainer}>
      <div className={styles.formSection}>
        {/* Category */}
        {renderComboboxField({
          name: 'categoria_id',
          label: 'Categoria',
          optionsKey: 'categories',
          placeholder: 'Categoria',
          hint: 'Description detalhada',
        })}

        {/* Director */}
        {renderComboboxField({
          name: 'diretor_id',
          label: 'Diretor',
          optionsKey: 'directors',
          placeholder: 'Diretor',
          hint: 'Description detalhada',
        })}

        {/* Actors */}
        {renderComboboxField({
          name: 'atores_ids',
          label: 'Atores',
          optionsKey: 'actors',
          placeholder: 'Atores',
          hint: 'Description detalhada',
        })}

        {/* Producer */}
        {renderComboboxField({
          name: 'produtora_id',
          label: 'Produtora',
          optionsKey: 'producers',
          placeholder: 'Produtora',
          hint: 'Description detalhada',
        })}

        {/* Languages */}
        {renderComboboxField({
          name: 'linguagem_id',
          label: 'Idiomas',
          optionsKey: 'languages',
          placeholder: 'Idiomas',
          hint: 'Description detalhada',
        })}

        {/* Countries */}
        {renderComboboxField({
          name: 'pais_origem_id',
          label: 'País',
          optionsKey: 'countries',
          placeholder: 'País',
          hint: 'Description detalhada',
        })}
      </div>

      {/* Navigation buttons */}
      <div className={styles.formActions}>
        <Button
          variant="secondary"
          onClick={handleBack}
          fullWidth
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar'}
        </Button>
      </div>

      {/* Submit status messages */}
      {submitError && (
        <div className={styles.errorMessage} role="alert">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className={styles.successMessage} role="status">
          Filme criado com sucesso! Redirecionando...
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        
        <h2 className={styles.sectionTitle}>Postar um Novo Filme</h2>
        {/* Stepper */}
        {renderStepper()}

        {/* Form Content */}
        <div className={styles.formWrapper}>
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>
      </div>
    </div>
  );
}