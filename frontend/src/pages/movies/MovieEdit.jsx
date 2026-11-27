import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import styles from "./movieEdit.module.css";
import { Field, FieldLabel, FieldContent, FieldHint, FieldError, FieldGroup, FieldIcon } from "../../components/field/Field";
import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxList } from "../../components/combobox/Combobox";
import posterPlaceholder from "../../assets/poster.png";

/**
 * localStorage key for draft
 */
const getDraftKey = (movieId) => `movie-edit-draft-${movieId}`;

/**
 * Draft structure: { formData, timestamp, movieId }
 */
const DRAFT_EXPIRY_HOURS = 24;
const AUTO_SAVE_DELAY_MS = 30000; // 30 seconds

/**
 * Normalize a name for safe comparison (trim + lowercase)
 * Does not modify the original label for display purposes.
 */
function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

/**
 * Build a Map for name -> item lookup from a catalog array.
 * Items must have a 'nome' field (and ideally 'id').
 */
function buildCatalogMap(items) {
  const map = new Map();
  if (Array.isArray(items)) {
    items.forEach((item) => {
      const key = normalizeName(item?.nome);
      if (key && !map.has(key)) {
        map.set(key, item);
      }
    });
  }
  return map;
}

/**
 * Cross-reference selected items from movieById() with catalog data by name.
 * Returns only the matched items enriched with their official id from the catalog.
 * Items without a catalog match are dropped silently (safe no-op).
 */
function resolveSelectedWithIds(selectedNames, catalogMap) {
  if (!Array.isArray(selectedNames)) return [];
  return selectedNames
    .map((name) => catalogMap.get(normalizeName(name)))
    .filter((item) => Boolean(item));
}

/**
 * MovieEdit - Form for editing an existing movie (admin only)
 * Pre-populates form with existing movie data
 * Shows before/after preview before confirming changes
 * Uses existing components: Field, Input, Combobox, Button
 */
export default function MovieEdit() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Navigation confirmation modal
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Form state - initialized with movie data
  const [formData, setFormData] = useState({
    titulo: "",
    ano: "",
    sinopse: "",
    duracao: "",
    orcamento: "",
    imagem: "",
    categorias: [],
    diretores: [],
    atores: [],
    linguagens: [],
    paises: [],
    produtoras: [],
  });

  // Track initial form data for unsaved changes detection
  const [initialFormData, setInitialFormData] = useState(null);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Draft state
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftData, setDraftData] = useState(null);

  // Validation errors
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

  // Combobox options - populated from movie API response
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

  // Store full relationship objects from API for combobox options
  const [apiRelationships, setApiRelationships] = useState({
    categorias: [],
    diretores: [],
    atores: [],
    produtoras: [],
    linguagens: [],
    paises: [],
  });

  /**
   * Format duration from database (HH:MM:SS) to input format (HH:MM or minutes)
   */
  function formatDurationForInput(durationStr) {
    if (!durationStr) return "";
    const [hours, minutes] = durationStr.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${totalMinutes}min`;
  }

  /**
   * Format budget from number to Brazilian currency format for input
   */
  function formatBudgetForInput(value) {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Extract relationship identifiers from movie data.
   * Handles multiple formats: objects with id/_id/nome, strings, or arrays of mixed types.
   * The returned identifiers must match the `value` field in combobox options (built by `buildOptions`).
   */
  const extractRelationshipIds = useCallback((fieldData, idField = 'id') => {
    if (!fieldData) return [];
    if (Array.isArray(fieldData)) {
      return fieldData
        .map(item => {
          // If item is an object with an ID field, use it
          if (item && typeof item === 'object' && item[idField]) {
            return item[idField].toString();
          }
          // If item has _id (MongoDB style)
          if (item && typeof item === 'object' && item._id) {
            return item._id.toString();
          }
          // If item is an object with nome, use nome as identifier (matches buildOptions)
          if (item && typeof item === 'object' && item.nome) {
            return item.nome.toString();
          }
          // If item is a string, use the string itself as identifier
          if (typeof item === 'string') {
            return item;
          }
          return null;
        })
        .filter(Boolean);
    }
    return [];
  }, []);

  /**
   * Fetch movie data on mount and populate form directly from API response
   */
  const fetchMovie = useCallback(async () => {
    if (!id) {
      setError("ID do filme não encontrado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.movieById(id);
      console.log(data)
      setMovie(data);

      // Store full relationship objects from API for combobox options
      // The API response may have relationships as arrays of objects with 'nome' or as arrays of strings
      const apiRels = {
        categorias: Array.isArray(data.categorias) ? data.categorias : [],
        diretores: Array.isArray(data.diretores) ? data.diretores : [],
        atores: Array.isArray(data.atores) ? data.atores : [],
        produtoras: Array.isArray(data.produtoras) ? data.produtoras : [],
        linguagens: Array.isArray(data.linguagens) ? data.linguagens : [],
        paises: Array.isArray(data.paises) ? data.paises : [],
      };
      setApiRelationships(apiRels);

      // Build combobox options from movie API response
      const buildOptions = (items) => {
        if (!Array.isArray(items)) return [];
        return items.map((item, index) => {
          // If item is an object with id and nome
          if (item && typeof item === 'object') {
            const value = item.id?.toString() || item._id?.toString() || item.nome?.toString() || index.toString();
            const label = item.nome || item.name || item.titulo || item.title || String(item);
            return { value, label };
          }
          // If item is a string
          return { value: item.toString(), label: item.toString() };
        });
      };

      const movieOptions = {
        categories: buildOptions(apiRels.categorias),
        directors: buildOptions(apiRels.diretores),
        actors: buildOptions(apiRels.atores),
        producers: buildOptions(apiRels.produtoras),
        languages: buildOptions(apiRels.linguagens),
        countries: buildOptions(apiRels.paises),
      };
      setOptions(movieOptions);

      // Initialize form with movie data - populate relationships directly from API response
      // The API returns full relationship objects (with IDs) or names that we can match
      const initialData = {
        titulo: data.titulo || "",
        ano: data.ano?.toString() || "",
        sinopse: data.sinopse || "",
        duracao: formatDurationForInput(data.duracao) || "",
        orcamento: formatBudgetForInput(data.orcamento) || "",
        imagem: data.poster || data.imagem || "",
        // Extract IDs directly from relationship objects in the API response
        categorias: extractRelationshipIds(data.categorias),
        diretores: extractRelationshipIds(data.diretores),
        atores: extractRelationshipIds(data.atores),
        linguagens: extractRelationshipIds(data.linguagens),
        paises: extractRelationshipIds(data.paises),
        produtoras: extractRelationshipIds(data.produtoras),
      };
      setFormData(initialData);
      setInitialFormData(initialData);
    } catch (err) {
      console.error("Erro ao carregar filme:", err);
      setError(err.message || "Erro ao carregar detalhes do filme");
    } finally {
      setLoading(false);
    }
  }, [id, api, extractRelationshipIds]);

  // Fetch on mount
  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  /**
   * Save draft to localStorage
   */
  const saveDraft = useCallback(() => {
    if (!id) return;
    const draft = {
      formData,
      timestamp: Date.now(),
      movieId: id,
    };
    try {
      localStorage.setItem(getDraftKey(id), JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed to save draft:", e);
    }
  }, [formData, id]);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    if (!id) return;
    try {
      localStorage.removeItem(getDraftKey(id));
    } catch (e) {
      console.warn("Failed to clear draft:", e);
    }
  }, [id]);

  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback(() => {
    if (!id) return null;
    try {
      const stored = localStorage.getItem(getDraftKey(id));
      if (!stored) return null;
      const draft = JSON.parse(stored);
      // Validate draft
      if (draft.movieId !== id) return null;
      const ageHours = (Date.now() - draft.timestamp) / (1000 * 60 * 60);
      if (ageHours > DRAFT_EXPIRY_HOURS) {
        clearDraft();
        return null;
      }
      return draft;
    } catch (e) {
      console.warn("Failed to load draft:", e);
      return null;
    }
  }, [id, clearDraft]);

  /**
   * Check for and restore draft on mount
   */
  useEffect(() => {
    if (!id || !movie) return;

    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      const draft = loadDraft();
      if (draft && draft.formData) {
        // Check if form data differs from current movie data (has meaningful changes)
        const hasMeaningfulChanges = Object.keys(draft.formData).some(key => {
          const draftValue = draft.formData[key];
          const currentValue = formData[key];
          // Compare arrays by JSON stringify, primitives directly
          if (Array.isArray(draftValue) && Array.isArray(currentValue)) {
            return JSON.stringify(draftValue) !== JSON.stringify(currentValue);
          }
          return draftValue !== currentValue;
        });

        if (hasMeaningfulChanges) {
          setDraftData(draft);
          setShowDraftBanner(true);
        } else {
          // Draft is same as current, clear it
          clearDraft();
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [id, movie, formData, loadDraft, clearDraft]);

  /**
   * Handle draft restore
   */
  const handleRestoreDraft = useCallback(() => {
    if (draftData && draftData.formData) {
      setFormData(draftData.formData);
      setInitialFormData(draftData.formData);
    }
    setShowDraftBanner(false);
    setDraftData(null);
  }, [draftData]);

  /**
   * Handle draft discard
   */
  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftBanner(false);
    setDraftData(null);
  }, [clearDraft]);

  /**
   * Auto-save draft: debounced (30s) + on blur + beforeunload
   */
  useEffect(() => {
    if (!id || !movie) return;

    let debounceTimer = null;

    const triggerSave = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveDraft();
      }, AUTO_SAVE_DELAY_MS);
    };

    // Save on form data change (debounced)
    triggerSave();

    // Save on blur of any field
    const handleBlur = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      saveDraft();
    };

    // Save before unload
    const handleBeforeUnload = () => {
      saveDraft();
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, id, movie, saveDraft]);

  /**
   * Format duration for display in preview - normalizes both original (HH:MM:SS)
   * and edited (various formats) to consistent "Xh Ymin" format
   */
  function formatDurationForDisplay(durationStr) {
    if (!durationStr) return "—";

    // Handle original format: HH:MM:SS or HH:MM
    const timeMatch = durationStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}min`;
      } else if (hours > 0) {
        return `${hours}h`;
      }
      return `${minutes}min`;
    }

    // Handle edited format: "Xh Ymin"
    const hourMinMatch = durationStr.match(/(\d+)h\s*(\d*)min?/);
    if (hourMinMatch) {
      const hours = parseInt(hourMinMatch[1], 10);
      const minutes = parseInt(hourMinMatch[2] || '0', 10);
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}min`;
      } else if (hours > 0) {
        return `${hours}h`;
      }
      return `${minutes}min`;
    }

    // Handle "Xmin" or just number
    const minOnlyMatch = durationStr.match(/^(\d+)\s*min?$/);
    if (minOnlyMatch) {
      const totalMinutes = parseInt(minOnlyMatch[1], 10);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}min`;
      } else if (hours > 0) {
        return `${hours}h`;
      }
      return `${minutes}min`;
    }

    // Fallback: return as-is if unrecognized
    return durationStr;
  }

  /**
   * Format budget for display in preview - normalizes both original (number)
   * and edited (formatted string) to consistent Brazilian currency format
   */
  function formatBudgetForDisplay(budgetValue) {
    if (budgetValue === null || budgetValue === undefined || budgetValue === "") return "—";

    // If it's already a formatted string (edited), parse it first
    let numericValue;
    if (typeof budgetValue === 'string') {
      numericValue = parseBudget(budgetValue);
    } else {
      numericValue = Number(budgetValue);
    }

    if (isNaN(numericValue)) return "—";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(numericValue);
  }

  /**
   * Parse duration string to MySQL TIME format (HH:MM:SS)
   */
  const parseDurationToTime = useCallback((durationStr) => {
    const str = durationStr.trim().toLowerCase();

    // Format 1: HH:MM:SS or HH:MM
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10).toString().padStart(2, '0');
      const minutes = timeMatch[2].padStart(2, '0');
      const seconds = (timeMatch[3] || '00').padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }

    // Format 2: "Xh Ymin"
    const hourMinMatch = str.match(/(\d+)h\s*(\d*)min?/);
    if (hourMinMatch) {
      const hours = parseInt(hourMinMatch[1], 10);
      const minutes = parseInt(hourMinMatch[2] || '0', 10);
      const totalMinutes = hours * 60 + minutes;
      const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const m = (totalMinutes % 60).toString().padStart(2, '0');
      return `${h}:${m}:00`;
    }

    // Format 3: "Xmin" or "X min" or just number
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

    return '00:00:00';
  }, []);

  /**
   * Parse budget string to number
   */
  const parseBudget = useCallback((budgetStr) => {
    const numeric = budgetStr.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(numeric) || 0;
  }, []);

  /**
   * Validate a single field
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
        const durationStr = value.toString().trim().toLowerCase();
        const validFormats = [
          /^\d{1,2}:\d{2}(:\d{2})?$/,
          /^\d+h\s*\d*min?$/,
          /^\d+\s*min?$/,
          /^\d+$/,
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

      case 'categorias':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos uma categoria';
        }
        return null;

      case 'diretores':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um diretor';
        }
        return null;

      case 'atores':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um ator';
        }
        return null;

      case 'produtoras':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos uma produtora';
        }
        return null;

      case 'linguagens':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um idioma';
        }
        return null;

      case 'paises':
        if (!value || value.length === 0) {
          return 'Selecione pelo menos um país';
        }
        return null;

      default:
        return null;
    }
  }, []);

  /**
   * Validate all fields
   */
  const validateAll = useCallback(() => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  /**
   * Handle input change for basic form fields
   */
  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  /**
   * Handle combobox selection change for array fields
   */
  const handleArrayChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  /**
   * Compare form data with initial data to detect unsaved changes
   */
  const checkForChanges = useCallback(() => {
    if (!initialFormData) return false;

    const fieldsToCompare = [
      'titulo', 'ano', 'sinopse', 'duracao', 'orcamento', 'imagem',
      'categorias', 'diretores', 'atores', 'linguagens', 'paises', 'produtoras'
    ];

    return fieldsToCompare.some(field => {
      const initial = initialFormData[field];
      const current = formData[field];

      // For arrays, compare sorted values
      if (Array.isArray(initial) && Array.isArray(current)) {
        const sortedInitial = [...initial].sort();
        const sortedCurrent = [...current].sort();
        return sortedInitial.length !== sortedCurrent.length ||
               sortedInitial.some((v, i) => v !== sortedCurrent[i]);
      }

      return initial !== current;
    });
  }, [initialFormData, formData]);

  /**
   * Track unsaved changes
   */
  useEffect(() => {
    if (initialFormData) {
      const hasChanges = checkForChanges();
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialFormData, checkForChanges]);

  /**
   * Handle browser close/refresh - show confirmation if unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges && !saving && !saveSuccess) {
        event.preventDefault();
        event.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saving, saveSuccess]);

  /**
   * Handle navigation with unsaved changes confirmation
   */
  const handleNavigation = useCallback((destination) => {
    if (hasUnsavedChanges && !saving && !saveSuccess) {
      setPendingNavigation(destination);
      setShowLeaveConfirm(true);
    } else {
      navigate(destination);
    }
  }, [hasUnsavedChanges, saving, saveSuccess, navigate]);

  /**
   * Confirm leaving - proceed with navigation
   */
  const confirmLeave = useCallback(() => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowLeaveConfirm(false);
    setPendingNavigation(null);
  }, [pendingNavigation, navigate]);

  /**
   * Cancel leaving - stay on page
   */
  const cancelLeave = useCallback(() => {
    setShowLeaveConfirm(false);
    setPendingNavigation(null);
  }, []);

  /**
   * Show preview modal with before/after comparison
   */
  const handlePreview = () => {
    if (validateAll()) {
      setShowPreview(true);
    }
  };

  /**
   * Save changes
   */
  const handleSave = useCallback(async () => {
    if (!validateAll()) {
      setShowPreview(false);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const movieData = {
        titulo: formData.titulo.trim(),
        ano: parseInt(formData.ano, 10),
        sinopse: formData.sinopse.trim(),
        duracao: parseDurationToTime(formData.duracao),
        imagem: formData.imagem.trim(),
        // Backend expects formatted string like "R$ 1.000.000,00", not a number
        orcamento: formData.orcamento.trim(),
        // Convert string IDs to numbers for API (API expects number[])
        categorias: (formData.categorias || []).map(id => parseInt(id, 10)),
        diretores: (formData.diretores || []).map(id => parseInt(id, 10)),
        atores: (formData.atores || []).map(id => parseInt(id, 10)),
        linguagens: (formData.linguagens || []).map(id => parseInt(id, 10)),
        paises: (formData.paises || []).map(id => parseInt(id, 10)),
        produtoras: (formData.produtoras || []).map(id => parseInt(id, 10)),
        // Also send primary production company if available (first in array)
        id_produtora_principal: (formData.produtoras || [])[0] ? parseInt(formData.produtoras[0], 10) : undefined,
      };

      await api.updateMovie(id, movieData);

      // Clear draft on successful save
      clearDraft();

      setSaveSuccess(true);
      setShowPreview(false);

      // Redirect back to movie details after short delay
      setTimeout(() => {
        navigate(`/movies/${id}`);
      }, 2000);
    } catch (err) {
      console.error("Erro ao atualizar filme:", err);

      // Check for duplicate/unique constraint violation
      const isDuplicate = err?.response?.status === 409 ||
        (err?.response?.status === 400 &&
          (err?.response?.data?.message?.toLowerCase().includes("duplicate") ||
            err?.response?.data?.message?.toLowerCase().includes("unique") ||
            err?.response?.data?.message?.toLowerCase().includes("already exists") ||
            err?.response?.data?.message?.toLowerCase().includes("título já existe") ||
            err?.response?.data?.message?.toLowerCase().includes("title already exists")));

      if (isDuplicate) {
        setSaveError("Já existe um filme com este título e ano");
        // Highlight the titulo and ano fields
        setErrors(prev => ({
          ...prev,
          titulo: "Este título com este ano já está cadastrado",
          ano: "Este título com este ano já está cadastrado",
        }));
      } else {
        setSaveError(err.message || "Erro ao atualizar filme");
      }
    } finally {
      setSaving(false);
    }
  }, [formData, id, api, validateAll, parseDurationToTime, parseBudget, navigate, clearDraft]);

  /**
   * Handle image error
   */
  const handleImageError = (e) => {
    e.target.src = posterPlaceholder;
  };

  // Get selected option labels for preview (edited values)
  const getSelectedLabels = (fieldName, optionKey) => {
    const selectedIds = formData[fieldName] || [];
    const opts = options[optionKey] || [];
    return selectedIds.map(id => {
      const opt = opts.find(o => o.value === id);
      return opt ? opt.label : id;
    }).join(", ");
  };

  // Get original labels from movie data (handles different formats from API)
  const getOriginalLabels = (fieldName) => {
    if (!movie) return "";
    const fieldData = movie[fieldName];

    if (!fieldData) return "";

    // Handle string (comma-separated names)
    if (typeof fieldData === 'string') {
      return fieldData;
    }
    // Handle array (strings or objects with 'nome')
    if (Array.isArray(fieldData)) {
      return fieldData.map(item => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && item.nome) return item.nome.trim();
        return String(item).trim();
      }).filter(Boolean).join(", ");
    }
    // Fallback: convert to string
    return String(fieldData);
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.error}>
          Erro: {error}
          <Button variant="secondary" onClick={() => navigate("/movies")} style={{ marginTop: "1rem" }}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.error}>
          Filme não encontrado
          <Button variant="secondary" onClick={() => navigate("/movies")} style={{ marginTop: "1rem" }}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Fields to compare in preview - raw values for comparison, formatted for display
  const previewFields = [
    { key: 'titulo', label: 'Título', original: movie.titulo, edited: formData.titulo, displayOriginal: movie.titulo, displayEdited: formData.titulo },
    { key: 'ano', label: 'Ano', original: movie.ano, edited: formData.ano, displayOriginal: movie.ano, displayEdited: formData.ano },
    { key: 'sinopse', label: 'Sinopse', original: movie.sinopse, edited: formData.sinopse, displayOriginal: movie.sinopse, displayEdited: formData.sinopse },
    { key: 'duracao', label: 'Duração', original: movie.duracao, edited: formData.duracao, displayOriginal: formatDurationForDisplay(movie.duracao), displayEdited: formatDurationForDisplay(formData.duracao) },
    { key: 'orcamento', label: 'Orçamento', original: movie.orcamento, edited: formData.orcamento, displayOriginal: formatBudgetForDisplay(movie.orcamento), displayEdited: formatBudgetForDisplay(formData.orcamento) },
    { key: 'imagem', label: 'Imagem', original: movie.poster || movie.imagem, edited: formData.imagem, displayOriginal: movie.poster || movie.imagem, displayEdited: formData.imagem, isImage: true },
    { key: 'categorias', label: 'Categorias', original: getOriginalLabels('categorias'), edited: getSelectedLabels('categorias', 'categories'), displayOriginal: getOriginalLabels('categorias'), displayEdited: getSelectedLabels('categorias', 'categories') },
    { key: 'diretores', label: 'Diretores', original: getOriginalLabels('diretores'), edited: getSelectedLabels('diretores', 'directors'), displayOriginal: getOriginalLabels('diretores'), displayEdited: getSelectedLabels('diretores', 'directors') },
    { key: 'atores', label: 'Atores', original: getOriginalLabels('atores'), edited: getSelectedLabels('atores', 'actors'), displayOriginal: getOriginalLabels('atores'), displayEdited: getSelectedLabels('atores', 'actors') },
    { key: 'produtoras', label: 'Produtoras', original: getOriginalLabels('produtoras'), edited: getSelectedLabels('produtoras', 'producers'), displayOriginal: getOriginalLabels('produtoras'), displayEdited: getSelectedLabels('produtoras', 'producers') },
    { key: 'linguagens', label: 'Idiomas', original: getOriginalLabels('linguagens'), edited: getSelectedLabels('linguagens', 'languages'), displayOriginal: getOriginalLabels('linguagens'), displayEdited: getSelectedLabels('linguagens', 'languages') },
    { key: 'paises', label: 'Países', original: getOriginalLabels('paises'), edited: getSelectedLabels('paises', 'countries'), displayOriginal: getOriginalLabels('paises'), displayEdited: getSelectedLabels('paises', 'countries') },
  ];

  const hasChanges = previewFields.some(f => f.original !== f.edited);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Button variant="secondary" onClick={() => handleNavigation(`/movies/${id}`)} style={{ marginBottom: "1rem" }}>
            ← Voltar
          </Button>
          <h1 className={styles.title}>Editar Filme</h1>
          <p className={styles.subtitle}>{movie.titulo} ({movie.ano})</p>
        </header>

        {/* Save error/success messages */}
        {saveError && (
          <div className={styles.errorMessage} role="alert">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className={styles.successMessage} role="status">
            Filme atualizado com sucesso! Redirecionando...
          </div>
        )}

        {/* Draft restore banner */}
        {showDraftBanner && (
          <div className={styles.draftBanner} role="alert">
            <div className={styles.draftBannerContent}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Rascunho salvo encontrado. Restaurar?</span>
            </div>
            <div className={styles.draftBannerActions}>
              <Button variant="secondary" onClick={handleDiscardDraft} size="sm">
                Descartar
              </Button>
              <Button variant="primary" onClick={handleRestoreDraft} size="sm">
                Restaurar
              </Button>
            </div>
          </div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formSection}>
            {/* Image URL */}
            <Field required invalid={!!errors.imagem} className={styles.field}>
              <FieldLabel htmlFor="imagem">URL da Imagem</FieldLabel>
              <FieldContent>
                <Input
                  id="imagem"
                  name="imagem"
                  type="url"
                  placeholder="https://"
                  value={formData.imagem}
                  onChange={(e) => handleChange('imagem', e.target.value)}
                  onBlur={() => validateField('imagem', formData.imagem)}
                  inputMode="url"
                  className={styles.input}
                  autoComplete="off"
                />
              </FieldContent>
              <FieldHint>Por enquanto apenas aceitamos o link da imagem</FieldHint>
              {errors.imagem && <FieldError>{errors.imagem}</FieldError>}
            </Field>

            {/* Current poster preview */}
            {formData.imagem && (
              <div className={styles.currentPoster}>
                <span>Preview da imagem:</span>
                <img src={formData.imagem} alt={formData.titulo || movie.titulo} onError={handleImageError} />
              </div>
            )}

            {/* Title */}
            <Field required invalid={!!errors.titulo} className={styles.field}>
              <FieldLabel htmlFor="titulo">Título</FieldLabel>
              <FieldContent>
                <Input
                  id="titulo"
                  name="titulo"
                  type="text"
                  placeholder="Ex: O Som do Silêncio"
                  value={formData.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  onBlur={() => validateField('titulo', formData.titulo)}
                  className={styles.input}
                  autoComplete="off"
                />
              </FieldContent>
              {errors.titulo && <FieldError>{errors.titulo}</FieldError>}
            </Field>

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
                    value={formData.ano}
                    onChange={(e) => handleChange('ano', e.target.value)}
                    onBlur={() => validateField('ano', formData.ano)}
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
                    value={formData.duracao}
                    onChange={(e) => handleChange('duracao', e.target.value)}
                    onBlur={() => validateField('duracao', formData.duracao)}
                    className={styles.input}
                    autoComplete="off"
                  />
                </FieldContent>
                <FieldHint>Formatos aceitos: HH:MM, 2h 30min, 150 min, 150</FieldHint>
                {errors.duracao && <FieldError>{errors.duracao}</FieldError>}
              </Field>
            </FieldGroup>

            {/* Budget */}
            <Field required invalid={!!errors.orcamento} className={styles.field}>
              <FieldLabel htmlFor="orcamento">Orçamento</FieldLabel>
              <FieldContent>
                <Input
                  id="orcamento"
                  name="orcamento"
                  type="text"
                  placeholder="R$ 999.999.999.999"
                  value={formData.orcamento}
                  onChange={(e) => handleChange('orcamento', e.target.value)}
                  onBlur={() => validateField('orcamento', formData.orcamento)}
                  className={styles.input}
                  autoComplete="off"
                />
              </FieldContent>
              <FieldHint>Formato: R$ 1.000.000,00</FieldHint>
              {errors.orcamento && <FieldError>{errors.orcamento}</FieldError>}
            </Field>

            {/* Synopsis */}
            <Field required invalid={!!errors.sinopse} className={styles.field}>
              <FieldLabel htmlFor="sinopse">Sinopse / Roteiro</FieldLabel>
              <FieldContent>
                <textarea
                  id="sinopse"
                  name="sinopse"
                  placeholder="Breve descrição sobre o roteiro do filme..."
                  value={formData.sinopse}
                  onChange={(e) => handleChange('sinopse', e.target.value)}
                  onBlur={() => validateField('sinopse', formData.sinopse)}
                  className={styles.textarea}
                  rows={6}
                  autoComplete="off"
                />
              </FieldContent>
              <FieldHint>Breve descrição sobre o roteiro do filme.</FieldHint>
              {errors.sinopse && <FieldError>{errors.sinopse}</FieldError>}
            </Field>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Informações Adicionais</h3>

            {/* Category */}
            <Field required invalid={!!errors.categorias} className={styles.field}>
              <FieldLabel htmlFor="categorias">Categorias</FieldLabel>
              <FieldContent>
                <Combobox
                  id="categorias"
                  name="categorias"
                  value={formData.categorias}
                  onValueChange={(value) => handleArrayChange('categorias', value)}
                  multiple
                  clearable
                  placeholder="Selecionar categorias"
                  loading={loadingOptions.categories}
                  options={options.categories}
                  autocomplete
                  className={styles.combobox}
                >
                  <ComboboxTrigger
                    inputProps={{
                      'aria-label': 'Categorias',
                      'aria-describedby': errors.categorias ? 'categorias-error' : 'categorias-hint',
                    }}
                  >
                    <ComboboxContent>
                      <ComboboxList />
                    </ComboboxContent>
                  </ComboboxTrigger>
                </Combobox>
              </FieldContent>
              <FieldHint id="categorias-hint">Selecione uma ou mais categorias</FieldHint>
              {optionErrors.categories && <FieldHint style={{ color: '#FF8080' }}>{optionErrors.categories}</FieldHint>}
              {errors.categorias && <FieldError id="categorias-error">{errors.categorias}</FieldError>}
            </Field>

            {/* Director */}
            <Field required invalid={!!errors.diretores} className={styles.field}>
              <FieldLabel htmlFor="diretores">Diretores</FieldLabel>
              <FieldContent>
                <Combobox
                  id="diretores"
                  name="diretores"
                  value={formData.diretores}
                  onValueChange={(value) => handleArrayChange('diretores', value)}
                  multiple
                  clearable
                  placeholder="Selecionar diretores"
                  loading={loadingOptions.directors}
                  options={options.directors}
                  autocomplete
                  className={styles.combobox}
                >
                  <ComboboxTrigger
                    inputProps={{
                      'aria-label': 'Diretores',
                      'aria-describedby': errors.diretores ? 'diretores-error' : 'diretores-hint',
                    }}
                  >
                    <ComboboxContent>
                      <ComboboxList />
                    </ComboboxContent>
                  </ComboboxTrigger>
                </Combobox>
              </FieldContent>
              <FieldHint id="diretores-hint">Selecione um ou mais diretores</FieldHint>
              {optionErrors.directors && <FieldHint style={{ color: '#FF8080' }}>{optionErrors.directors}</FieldHint>}
              {errors.diretores && <FieldError id="diretores-error">{errors.diretores}</FieldError>}
            </Field>

            {/* Actors */}
            <Field required invalid={!!errors.atores} className={styles.field}>
              <FieldLabel htmlFor="atores">Atores</FieldLabel>
              <FieldContent>
                <Combobox
                  id="atores"
                  name="atores"
                  value={formData.atores}
                  onValueChange={(value) => handleArrayChange('atores', value)}
                  multiple
                  clearable
                  placeholder="Selecionar atores"
                  loading={loadingOptions.actors}
                  options={options.actors}
                  autocomplete
                  className={styles.combobox}
                >
                  <ComboboxTrigger
                    inputProps={{
                      'aria-label': 'Atores',
                      'aria-describedby': errors.atores ? 'atores-error' : 'atores-hint',
                    }}
                  >
                    <ComboboxContent>
                      <ComboboxList />
                    </ComboboxContent>
                  </ComboboxTrigger>
                </Combobox>
              </FieldContent>
              <FieldHint id="atores-hint">Selecione um ou mais atores</FieldHint>
              {optionErrors.actors && <FieldHint style={{ color: '#FF8080' }}>{optionErrors.actors}</FieldHint>}
              {errors.atores && <FieldError id="atores-error">{errors.atores}</FieldError>}
            </Field>

            {/* Producer */}
            <Field required invalid={!!errors.produtoras} className={styles.field}>
              <FieldLabel htmlFor="produtoras">Produtoras</FieldLabel>
              <FieldContent>
                <Combobox
                  id="produtoras"
                  name="produtoras"
                  value={formData.produtoras}
                  onValueChange={(value) => handleArrayChange('produtoras', value)}
                  multiple
                  clearable
                  placeholder="Selecionar produtoras"
                  loading={loadingOptions.producers}
                  options={options.producers}
                  autocomplete
                  className={styles.combobox}
                >
                  <ComboboxTrigger
                    inputProps={{
                      'aria-label': 'Produtoras',
                      'aria-describedby': errors.produtoras ? 'produtoras-error' : 'produtoras-hint',
                    }}
                  >
                    <ComboboxContent>
                      <ComboboxList />
                    </ComboboxContent>
                  </ComboboxTrigger>
                </Combobox>
              </FieldContent>
              <FieldHint id="produtoras-hint">Selecione uma ou mais produtoras</FieldHint>
              {optionErrors.producers && <FieldHint style={{ color: '#FF8080' }}>{optionErrors.producers}</FieldHint>}
              {errors.produtoras && <FieldError id="produtoras-error">{errors.produtoras}</FieldError>}
            </Field>

            {/* Languages */}
            <Field required invalid={!!errors.linguagens} className={styles.field}>
              <FieldLabel htmlFor="linguagens">Idiomas</FieldLabel>
              <FieldContent>
                <Combobox
                  id="linguagens"
                  name="linguagens"
                  value={formData.linguagens}
                  onValueChange={(value) => handleArrayChange('linguagens', value)}
                  multiple
                  clearable
                  placeholder="Selecionar idiomas"
                  loading={loadingOptions.languages}
                  options={options.languages}
                  autocomplete
                  className={styles.combobox}
                >
                  <ComboboxTrigger
                    inputProps={{
                      'aria-label': 'Idiomas',
                      'aria-describedby': errors.linguagens ? 'linguagens-error' : 'linguagens-hint',
                    }}
                  >
                    <ComboboxContent>
                      <ComboboxList />
                    </ComboboxContent>
                  </ComboboxTrigger>
                </Combobox>
              </FieldContent>
              <FieldHint id="linguagens-hint">Selecione um ou mais idiomas</FieldHint>
              {optionErrors.languages && <FieldHint style={{ color: '#FF8080' }}>{optionErrors.languages}</FieldHint>}
              {errors.linguagens && <FieldError id="linguagens-error">{errors.linguagens}</FieldError>}
            </Field>

            {/* Countries */}
            <Field required invalid={!!errors.paises} className={styles.field}>
              <FieldLabel htmlFor="paises">Países</FieldLabel>
              <FieldContent>
                <Combobox
                  id="paises"
                  name="paises"
                  value={formData.paises}
                  onValueChange={(value) => handleArrayChange('paises', value)}
                  multiple
                  clearable
                  placeholder="Selecionar países"
                  loading={loadingOptions.countries}
                  options={options.countries}
                  autocomplete
                  className={styles.combobox}
                >
                  <ComboboxTrigger
                    inputProps={{
                      'aria-label': 'Países',
                      'aria-describedby': errors.paises ? 'paises-error' : 'paises-hint',
                    }}
                  >
                    <ComboboxContent>
                      <ComboboxList />
                    </ComboboxContent>
                  </ComboboxTrigger>
                </Combobox>
              </FieldContent>
              <FieldHint id="paises-hint">Selecione um ou mais países</FieldHint>
              {optionErrors.countries && <FieldHint style={{ color: '#FF8080' }}>{optionErrors.countries}</FieldHint>}
              {errors.paises && <FieldError id="paises-error">{errors.paises}</FieldError>}
            </Field>
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <Button
              variant="secondary"
              onClick={() => handleNavigation(`/movies/${id}`)}
              disabled={saving}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handlePreview}
              disabled={saving}
              fullWidth
            >
              {saving ? 'Salvando...' : hasChanges ? 'Ver Alterações' : 'Sem Alterações'}
            </Button>
          </div>
        </form>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className={styles.modalOverlay} onClick={cancelLeave} role="dialog" aria-modal="true" aria-labelledby="leave-confirm-title">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2 id="leave-confirm-title" className={styles.modalTitle}>Alterações não salvas</h2>
            </header>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                Você tem alterações não salvas. Se sair agora, suas alterações serão perdidas.
              </p>
            </div>
            <footer className={styles.modalFooter}>
              <Button
                variant="primary"
                onClick={cancelLeave}
              >
                Continuar editando
              </Button>
              <Button
                variant="secondary"
                onClick={confirmLeave}
              >
                Sair mesmo assim
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className={styles.modalOverlay} onClick={() => setShowPreview(false)} role="dialog" aria-modal="true" aria-labelledby="preview-title">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2 id="preview-title" className={styles.modalTitle}>Confirmar Alterações</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowPreview(false)}
                aria-label="Fechar prévia"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                Compare os dados originais (esquerda) com os editados (direita) antes de confirmar:
              </p>
              <div className={styles.previewGrid}>
                <div className={styles.previewColumn}>
                  <h3 className={styles.previewColumnTitle}>Original</h3>
                  {previewFields.map((field) => (
                    <div key={field.key} className={styles.previewRow}>
                      <span className={styles.previewLabel}>{field.label}:</span>
                      {field.isImage ? (
                        <div className={styles.previewImageContainer}>
                          <img
                            src={field.original}
                            alt={`${field.label} original`}
                            className={styles.previewImage}
                            onError={handleImageError}
                          />
                          {field.original && (
                            <span className={styles.previewImageUrl}>{field.original}</span>
                          )}
                        </div>
                      ) : (
                        <span className={`${styles.previewValue} ${styles.original}`}>
                          {field.displayOriginal || <em>—</em>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.previewColumn}>
                  <h3 className={styles.previewColumnTitle}>Editado</h3>
                  {previewFields.map((field) => (
                    <div key={field.key} className={`${styles.previewRow} ${field.original !== field.edited ? styles.changed : ''}`}>
                      <span className={styles.previewLabel}>{field.label}:</span>
                      {field.isImage ? (
                        <div className={styles.previewImageContainer}>
                          <img
                            src={field.edited}
                            alt={`${field.label} editado`}
                            className={styles.previewImage}
                            onError={handleImageError}
                          />
                          {field.edited && (
                            <span className={styles.previewImageUrl}>{field.edited}</span>
                          )}
                        </div>
                      ) : (
                        <span className={`${styles.previewValue} ${styles.edited}`}>
                          {field.displayEdited || <em>—</em>}
                          {field.original !== field.edited && (
                            <span className={styles.changeIndicator} aria-label="Alterado">✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={() => setShowPreview(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                loading={saving}
              >
                Confirmar e Salvar
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}