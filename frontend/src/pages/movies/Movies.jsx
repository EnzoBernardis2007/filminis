import styles from "./movies.module.css";
import commonStyles from "../../app.module.css";
import { useState, useEffect } from "react";
import { movies } from "../../services/api";
import posterPlaceholder from "../../assets/poster.png";

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

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
      <img src={image} onError={handleImageError} alt="" />
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
  const itemsPerPage = 9; 

  useEffect(() => {
    const fetchData = async () => {
      const data = await movies();
      console.log(data);
      setMoviesList(data);
    };

    fetchData();
  }, []);

  const totalPages = Math.ceil(moviesList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMovies = moviesList.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <>
      <section className={styles.section}>
        <div>
          <div class="btn-group" role="group" className={styles.buttonGroup}>
            <button type="button">Lista</button>
            <button type="button">Mosaico</button>
          </div>
        </div>
        <h2 className={commonStyles.sectionTitle}>Catálogo de Filmes</h2>
        <div className={styles.gridView}>
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

        {totalPages > 0 && (
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