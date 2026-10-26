import styles from "./movies.module.css";
import commonStyles from "../../app.module.css";
import { useState, useEffect } from "react";
import { movies } from "../../services/api";
import posterPlaceholder from "../../assets/poster.png";

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  return hours * 60 + minutes;
}

function Card({
  id,
  title,
  duration,
  synopsis,
  releaseYear,
  image,
  categories,
}) {
  const handleImageError = (e) => {
    e.target.src = posterPlaceholder;
  };

  return (
    <article className={styles.cardContainer}>
      <img src={image} onError={handleImageError} alt={title || "Poster do filme"} />
      <div>
        <p title={title} className={styles.title}>{title}</p>
        <dl>
          <dt>Ano</dt>
          <dd>{releaseYear}</dd>
          <dt>Duração</dt>
          <dd>{timeToMinutes(duration)} min</dd>
          <dt>Categorias</dt>
          <dd>{categories?.split(",")[0]?.trim()}</dd>
        </dl>
        <p>{synopsis}</p>
      </div>
    </article>
  );
}

export default function Movies() {
  const [moviesList, setMoviesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGrid, setIsGrid] = useState(true);
  const [keyword, setKeyword] = useState("");
  const itemsPerPage = 9; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await movies();
        setMoviesList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar os filmes:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

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
        
        <div className={isGrid ? styles.gridView : styles.listView}>
          {currentMovies.map((el) => (
            <Card
              key={el.id}
              id={el.id}
              title={el.titulo}
              releaseYear={el.ano}
              duration={el.duracao}
              categories={el.categorias}
              synopsis={el.sinopse}
              image={el.imagem}
            />
          ))}
        </div>

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