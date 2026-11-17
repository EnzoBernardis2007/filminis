import styles from "./movies.module.css";
import commonStyles from "../../app.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import posterPlaceholder from "../../assets/poster.png";

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  return hours * 60 + minutes;
}

function Card({
  titulo,
  duracao,
  sinopse,
  ano,
  imagem,
  categorias,
  onClick,
}) {
  const handleImageError = (e) => {
    e.target.src = posterPlaceholder;
  };

  return (
    <article className={styles.cardContainer} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <img src={imagem} onError={handleImageError} alt={titulo || "Poster do filme"} />
      <div>
        <p title={titulo} className={styles.title}>{titulo}</p>
        <dl>
          <dt>Ano</dt>
          <dd>{ano}</dd>
          <dt>Duração</dt>
          <dd>{timeToMinutes(duracao)} min</dd>
          <dt>Categorias</dt>
          <dd>{categorias?.split(",")[0]?.trim()}</dd>
        </dl>
        <p>{sinopse}</p>
      </div>
    </article>
  );
}

export default function Movies() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [moviesList, setMoviesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGrid, setIsGrid] = useState(true);
  const [keyword, setKeyword] = useState("");
  const itemsPerPage = isGrid ? 9 : 12;

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.movies();
        setMoviesList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar os filmes:", error);
      }
    };

    fetchData();
  }, [api]);

  // Reset to page 1 when keyword changes (derived state pattern)
  // Using a key on the component would be better but this is a minimal fix
  const [keywordForPageReset, setKeywordForPageReset] = useState("");

  if (keyword !== keywordForPageReset) {
    setCurrentPage(1);
    setKeywordForPageReset(keyword);
  }

  const searchedMovieList = Array.isArray(moviesList)
    ? moviesList.filter((el) =>
        el.titulo?.trim().toLowerCase().includes(keyword.trim().toLowerCase())
      )
    : [];

  const totalPages = Math.ceil(searchedMovieList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMovies = searchedMovieList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleGrid = (gridState) => {
    setIsGrid(gridState);
  };

  const handleSearch = (event) => {
    setKeyword(event.target.value);
  };

  return (
    <>
      <section className={styles.section}>
        <div className={`${commonStyles.flex} ${styles.toolbar}`}>
          <div className={styles.searchbar}>
            <label htmlFor="search-input">Pesquisar</label>
            <div>
              <input 
                id="search-input"
                onChange={handleSearch} 
                type="search" 
                value={keyword}
                placeholder="Ex: Matrix" 
              />
              <button type="button">Pesquisar</button>
            </div>
          </div>
          <div role="group" className={styles.buttonGroup}>
            <button
              className={isGrid ? styles.isActive : ""}
              type="button"
              onClick={() => handleGrid(true)}
            >
              Mosaico
            </button>
            <button
              className={!isGrid ? styles.isActive : ""}
              type="button"
              onClick={() => handleGrid(false)}
            >
              Lista
            </button>
          </div>
        </div>

        <h2 className={commonStyles.sectionTitle}>Catálogo de Filmes</h2>
        
        {
          isGrid ? (
            <div className={styles.gridView}>
              {currentMovies.map((el) => (
                <Card
                  key={el.id}
                  id={el.id}
                  titulo={el.titulo}
                  duracao={el.duracao}
                  sinopse={el.sinopse}
                  ano={el.ano}
                  imagem={el.imagem}
                  categorias={el.categorias}
                  onClick={() => handleMovieClick(el.id)}
                />
              ))}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Ano</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Duração</th>
                </tr>
              </thead>
              <tbody>
                {currentMovies.map((el) => (
                  <tr key={el.id} onClick={() => handleMovieClick(el.id)} style={{ cursor: 'pointer' }}>
                    <td>{el.titulo}</td>
                    <td>{el.ano}</td>
                    <td>{el.categorias?.split(",")[0]?.trim()}</td>
                    <td>{timeToMinutes(el.duracao)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
        

        {totalPages > 1 && (
          <nav className={styles.paginationContainer} aria-label="Navegação de página">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={styles.prevButton}
            >
              <span className={styles.arrowIcon}>‹</span> Anterior
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNum = index + 1;
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`${styles.pageButton} ${
                      isActive ? styles.activePage : styles.inactivePage
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={styles.prevButton}
            >
              Próximo <span className={styles.arrowIcon}>›</span>
            </button>
          </nav>
        )}
      </section>
    </>
  );
}