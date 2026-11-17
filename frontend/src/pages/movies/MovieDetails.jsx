import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import styles from './movieDetails.module.css'

/**
 * Hook customizado com toda a lógica da página de detalhes do filme
 * Retorna estado e handlers - o JSX fica a cargo do consumidor
 */
export function useMovieDetails() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
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
      } catch (err) {
        console.error("Erro ao carregar filme:", err);
        setError(err.message || "Erro ao carregar detalhes do filme");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, api]);

  const handleBack = () => {
    navigate(-1);
  };

  return {
    movie,
    loading,
    error,
    handleBack,
    movieId: id,
  };
}

export default function MovieDetails() {
  const { movie, loading, error, handleBack } = useMovieDetails();

  const [view, setView] = useState('produtoras') // 'produtoras' | 'idiomas'

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error} <button onClick={handleBack}>Voltar</button></div>;
  if (!movie) return <div>Filme não encontrado <button onClick={handleBack}>Voltar</button></div>;

  const produtoras = movie.produtoras || [];
  const idiomas = movie.linguagens || [];

  return (
    <div>
      <button onClick={handleBack}>← Voltar</button>
      <div className={styles.grid}>
        <div>
          <img className={styles.poster} src={movie.poster} alt={movie.titulo} />

          <div className={styles.tabs}>
            <button
              className={view === 'produtoras' ? styles.activeTab : ''}
              onClick={() => setView('produtoras')}
            >
              Produtoras ({produtoras.length})
            </button>
            <button
              className={view === 'idiomas' ? styles.activeTab : ''}
              onClick={() => setView('idiomas')}
            >
              Idiomas ({idiomas.length})
            </button>
          </div>

          <ul className={styles.list}>
            {view === 'produtoras' ? (
              produtoras.map((produtora, index) => (
                <li key={index}>
                  <p>{produtora.nome}</p>
                </li>
              ))
            ) : (
              idiomas.map((idioma, index) => (
                <li key={index}>{idioma}</li>
              ))
            )}
          </ul>

          {view === 'produtoras' && produtoras.length === 0 && (
            <p className={styles.empty}>Nenhuma produtora cadastrada</p>
          )}
          {view === 'idiomas' && idiomas.length === 0 && (
            <p className={styles.empty}>Nenhum idioma cadastrado</p>
          )}
        </div>
        <div>
          <h2>{movie.titulo} ({movie.ano})</h2>
          <p><strong>Duração:</strong> {movie.duracao}</p>
          <p><strong>Status:</strong> {movie.istatus}</p>
          <p><strong>Orçamento:</strong> {movie.orcamento ? `$${movie.orcamento.toLocaleString()}` : 'Não informado'}</p>
          <p><strong>Produtora Principal:</strong> {movie.produtora_principal || 'Não informada'}</p>

          <h3>Categorias</h3>
          <ul>
            {(movie.categorias || []).map((cat, i) => <li key={i}>{cat}</li>)}
          </ul>

          <h3>Diretores</h3>
          <ul>
            {(movie.diretores || []).map((dir, i) => (
              <li key={i}>{dir.nome} {dir.genero && `(${dir.genero})`} {dir.paises && `- ${dir.paises}`}</li>
            ))}
          </ul>

          <h3>Elenco</h3>
          <ul>
            {(movie.atores || []).map((ator, i) => (
              <li key={i}>{ator.nome} {ator.genero && `(${ator.genero})`} {ator.paises && `- ${ator.paises}`}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}