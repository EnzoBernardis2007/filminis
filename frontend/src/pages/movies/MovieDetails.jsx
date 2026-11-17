import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import styles from "./movieDetails.module.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/accordion/Accordion";

function durationToMinutes(durationStr) {
  if (!durationStr) return 0;
  const [hours, minutes] = durationStr.split(":").map(Number);
  return hours * 60 + minutes;
}

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
        console.log(data);
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
  const [activeTab, setActiveTab] = useState("synopsis");

  if (loading) return <div>Carregando...</div>;
  if (error)
    return (
      <div>
        Erro: {error} <button onClick={handleBack}>Voltar</button>
      </div>
    );
  if (!movie)
    return (
      <div>
        Filme não encontrado <button onClick={handleBack}>Voltar</button>
      </div>
    );

  const produtoras = movie.produtoras || [];
  const idiomas = movie.linguagens || [];
  const diretores = movie.diretores || [];
  const atores = movie.atores || [];

  const formatter = new Intl.ListFormat("pt-BR", {
    style: "long",
    type: "conjunction",
  });

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div>
      <button onClick={handleBack}>← Voltar</button>
      <div className={styles.grid}>
        <div className={styles.sidebar}>
          <div className={styles.poster}>
            <img src={movie.poster} alt={movie.titulo} />
          </div>
        </div>
        <div className={styles.columnTwo}>
          <div>
            <h2 className={styles.title}>
              {movie.titulo} <span>({movie.ano})</span>
            </h2>

            <p className={styles.directors}>
              Dirigido por{" "}
              <span>
                {formatter.format(diretores.map((dir) => dir.name || dir.nome))}
              </span>
              .
            </p>
          </div>

         

          <div className={styles.tabGroup}>
            <div className={styles.tabs} role="tablist" aria-label="Movie tabs">
              <button
                className={`${styles.tab} ${
                  activeTab === "synopsis" ? styles.activateTab : ""
                }`}
                role="tab"
                aria-selected={activeTab === "synopsis"}
                aria-controls="panel-cast"
                id="tab-cast"
                onClick={() => setActiveTab("synopsis")}
              >
                Sinopse
              </button>
              <button
                className={`${styles.tab} ${
                  activeTab === "categories" ? styles.activateTab : ""
                }`}
                role="tab"
                aria-selected={activeTab === "categories"}
                aria-controls="panel-cast"
                id="tab-cast"
                onClick={() => setActiveTab("categories")}
              >
                Categorias
              </button>
              <button
                className={`${styles.tab} ${
                  activeTab === "cast" ? styles.activateTab : ""
                }`}
                role="tab"
                aria-selected={activeTab === "cast"}
                aria-controls="panel-cast"
                id="tab-cast"
                onClick={() => setActiveTab("cast")}
              >
                Elenco
              </button>
            </div>

            <div
              role="tabpanel"
              id="panel-cast"
              aria-labelledby="tab-cast"
              hidden={activeTab !== "synopsis"}
            >
              <p className={styles.synopsis}>{movie.sinopse}</p>
            </div>

            <div
              role="tabpanel"
              id="panel-cast"
              aria-labelledby="tab-cast"
              hidden={activeTab !== "cast"}
            >
              {atores.length > 0 ? (
                <ul className={styles.chips}>
                  {atores.map((actor, index) => (
                    <li key={index}>
                      <p>{actor.nome}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum elenco registrado</p>
              )}
            </div>

            <div
              role="tabpanel"
              id="panel-cast"
              aria-labelledby="tab-cast"
              hidden={activeTab !== "categories"}
            >
              {movie.categorias.length > 0 ? (
                <ul className={styles.chips}>
                  {movie.categorias.map((cat, i) => (
                    <li key={i}>
                      <p>{cat}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum elenco registrado</p>
              )}
            </div>
          </div>
        </div>
        <div className={styles.columnThree}>
          <dl className={styles.info}>
            <p style={{ gridColumn: 'span 2', color: '#fff', fontWeight: 500, fontSize: 18}}>Informações Adicionais</p>
            <dt>Duração</dt>
            <dd>{durationToMinutes(movie.duracao)} min</dd>
            <dt>Orçamento</dt>
            <dd>{currencyFormatter.format(movie.orcamento)}</dd>
            <dt>Idiomas</dt>
            <div>
              {movie.linguagens.map((el, i) => (
                <dd key={i}>{el}</dd>
              ))}
            </div>
            <dt>Produtoras</dt>
            <div>
              {produtoras.map((el, i) => (
                <dd key={i}>{el.nome}</dd>
              ))}
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
