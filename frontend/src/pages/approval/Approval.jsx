import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import styles from "./approval.module.css";
import commonStyles from "../../app.module.css";
import posterPlaceholder from "../../assets/poster.png";
import Button from "../../components/button/Button";

/**
 * Converts duration string to minutes for display
 */
function durationToMinutes(durationStr) {
  if (!durationStr) return 0;
  const [hours, minutes] = durationStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function handleImageError(e) {
  e.target.src = posterPlaceholder;
}

/**
 * Custom hook for approval page logic
 * Fetches all movies from /listagem and filters for pending status client-side
 */
export function useApproval() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [allMovies, setAllMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Filter pending movies from all movies (istatus === "pendente")
  const pendingMovies = useMemo(() =>
    allMovies.filter(movie => movie.istatus === "pendente" || movie.status === "pendente"),
    [allMovies]
  );

  // Fetch all movies on mount
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const data = await api.movies();
        const movies = Array.isArray(data) ? data : [];
        setAllMovies(movies);
        const pending = movies.filter(m => m.istatus === "pendente" || m.status === "pendente");
        if (pending.length > 0) {
          setSelectedMovie(pending[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar filmes:", err);
        setError(err.message || "Erro ao carregar filmes");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [api]);

  const handleMovieSelect = useCallback((movie) => {
    setSelectedMovie(movie);
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selectedMovie || processing) return;

    setProcessing(true);
    try {
      // Call approve endpoint (PUT /aprovafilme?id=...)
      await api.approveMovie(selectedMovie.id);

      // Update local state - mark as approved
      setAllMovies(prev => prev.map(m =>
        m.id === selectedMovie.id ? { ...m, istatus: "aprovado" } : m
      ));

      // Select next pending movie or clear selection
      const nextPending = allMovies
        .filter(m => m.id !== selectedMovie.id)
        .find(m => m.istatus === "pendente" || m.status === "pendente");
      setSelectedMovie(nextPending || null);
    } catch (err) {
      console.error("Erro ao aprovar filme:", err);
      setError(err.message || "Erro ao aprovar filme");
    } finally {
      setProcessing(false);
    }
  }, [selectedMovie, processing, api, allMovies]);

  const handleReject = useCallback(async () => {
    if (!selectedMovie || processing) return;

    setProcessing(true);
    try {
      // Call reject endpoint (DELETE /filme?id=... or similar)
      // For now, remove from list
      await api.rejectMovie?.(selectedMovie.id);

      // Update local state - remove movie
      setAllMovies(prev => prev.filter(m => m.id !== selectedMovie.id));

      // Select next pending movie or clear selection
      const nextPending = allMovies
        .filter(m => m.id !== selectedMovie.id)
        .find(m => m.istatus === "pendente" || m.status === "pendente");
      setSelectedMovie(nextPending || null);
    } catch (err) {
      console.error("Erro ao rejeitar filme:", err);
      setError(err.message || "Erro ao rejeitar filme");
    } finally {
      setProcessing(false);
    }
  }, [selectedMovie, processing, api, allMovies]);

  return {
    pendingMovies,
    selectedMovie,
    loading,
    error,
    processing,
    handleMovieSelect,
    handleApprove,
    handleReject,
  };
}

function MovieListItem({ movie, isSelected, onClick }) {
  const directorName = movie.diretores?.[0]?.nome || movie.diretores?.[0]?.name || "Diretor desconhecido";

  return (
    <article
      className={`${styles.listItem} ${isSelected ? styles.selected : ""}`}
      onClick={() => onClick(movie)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(movie);
        }
      }}
      aria-selected={isSelected}
    >
      <h3 className={styles.movieTitle}>
        {movie.titulo} <span className={styles.movieYear}>({movie.ano})</span>
      </h3>
      <p className={styles.movieDirector}>
        Dirigido por <span>{directorName}</span>
      </p>
    </article>
  );
}

function BasicInformation({ movie }) {
  const producerNames = movie.produtoras?.map(p => p.nome || p.name).join(", ") || "Não informado";
  const languageNames = movie.linguagens?.map(l => l.nome || l.name || l).join(", ") || "Não informado";
  const countryNames = movie.paises_origem?.map(c => c.nome || c.name || c).join(", ") || "Não informado";

  return (
    <div className={styles.basicInfo}>
      <div className={styles.posterSection}>
        <img
          src={movie.poster || movie.imagem}
          alt={movie.titulo}
          onError={handleImageError}
          className={styles.poster}
        />
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Informações Básicas</h3>
        <div className={styles.sectionDivider} />

        <div className={styles.metadataRow}>
          <div className={styles.metadataField}>
            <label className={styles.fieldLabel}>Título</label>
            <div className={styles.fieldValue}>{movie.titulo}</div>
          </div>
          <div className={styles.metadataField}>
            <label className={styles.fieldLabel}>Ano</label>
            <div className={styles.fieldValue}>{movie.ano}</div>
          </div>
          <div className={styles.metadataField}>
            <label className={styles.fieldLabel}>Duração</label>
            <div className={styles.fieldValue}>{durationToMinutes(movie.duracao)} min</div>
          </div>
        </div>

        <div className={styles.synopsisField}>
          <label className={styles.fieldLabel}>Sinopse</label>
          <div className={styles.synopsisValue}>
            {movie.sinopse || "Sem sinopse disponível"}
          </div>
        </div>
      </div>
    </div>
  );
}

function InformationCategory({ label, tags }) {
  return (
    <div className={styles.categoryRow}>
      <label className={styles.categoryLabel}>{label}</label>
      <div className={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <span key={index} className={styles.tag}>
            {tag}
          </span>
        ))}
        {tags.length === 0 && (
          <span className={styles.emptyTag}>Não informado</span>
        )}
      </div>
    </div>
  );
}

/**
 * Normalizes a field that can be either an array of objects or a comma-separated string
 */
function normalizeTags(field) {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map(item => item?.nome || item?.name || item).filter(Boolean);
  }
  if (typeof field === 'string') {
    return field.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function AdditionalInformation({ movie }) {
  const categories = normalizeTags(movie.categorias);
  const directors = normalizeTags(movie.diretores);
  const actors = normalizeTags(movie.atores);
  const producers = normalizeTags(movie.produtoras);
  const languages = normalizeTags(movie.linguagens);
  const countries = normalizeTags(movie.paises_origem);

  return (
    <div className={styles.additionalInfo}>
      <h3 className={styles.sectionTitle}>Informações Adicionais</h3>
      <div className={styles.sectionDivider} />

      <div className={styles.categoriesGrid}>
        <InformationCategory label="Categorias" tags={categories} />
        <InformationCategory label="Diretores" tags={directors} />
        <InformationCategory label="Atores" tags={actors} />
        <InformationCategory label="Produtoras" tags={producers} />
        <InformationCategory label="Idiomas" tags={languages} />
        <InformationCategory label="Países" tags={countries} />
      </div>
    </div>
  );
}

function ApprovalActions({ onApprove, onReject, processing }) {
  return (
    <footer className={styles.actionsFooter}>
      <Button
        variant="secondary"
        onClick={onReject}
        disabled={processing}
        className={styles.rejectButton}
      >
        Rejeitar
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Button>

      <Button
        variant="primary"
        onClick={onApprove}
        disabled={processing}
        loading={processing}
        className={styles.approveButton}
      >
        Aprovar
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </Button>
    </footer>
  );
}

export default function Approval() {
  const {
    pendingMovies,
    selectedMovie,
    loading,
    error,
    processing,
    handleMovieSelect,
    handleApprove,
    handleReject,
  } = useApproval();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Carregando filmes pendentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Caixa de Aprovações</h1>
        <p className={styles.pageSubtitle}>
          Faça parte da maior comunidade de cinefilia do Brasil!
        </p>
      </header>

      <div className={styles.mainLayout}>
        {/* Left Column - Pending Approvals List */}
        <aside className={styles.leftColumn}>
          <div className={styles.pendingCard}>
            <div className={styles.pendingHeader}>
              <h2 className={styles.pendingTitle}>Aprovações Pendentes</h2>
              <span className={styles.pendingCounter}>{pendingMovies.length}</span>
            </div>

            <div className={styles.pendingList}>
              {pendingMovies.length > 0 ? (
                pendingMovies.map((movie) => (
                  <MovieListItem
                    key={movie.id}
                    movie={movie}
                    isSelected={selectedMovie?.id === movie.id}
                    onClick={handleMovieSelect}
                  />
                ))
              ) : (
                <div className={styles.emptyState}>
                  Nenhum filme pendente de aprovação
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Column - Movie Details Panel */}
        {selectedMovie && (
          <main className={styles.rightColumn}>
            <div className={styles.detailCard}>
              <BasicInformation movie={selectedMovie} />
              <AdditionalInformation movie={selectedMovie} />
              <ApprovalActions
                onApprove={handleApprove}
                onReject={handleReject}
                processing={processing}
              />
            </div>
          </main>
        )}

        {!selectedMovie && pendingMovies.length === 0 && (
          <main className={styles.rightColumn}>
            <div className={styles.emptyCard}>
              <p className={styles.emptyMessage}>
                Selecione um filme na lista para ver os detalhes
              </p>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}