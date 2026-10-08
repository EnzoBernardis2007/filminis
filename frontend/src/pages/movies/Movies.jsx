import styles from "./movies.module.css";
import commonStyles from "../../app.module.css";
import { useState, useEffect } from "react";
import { movies } from "../../services/api";
import posterPlaceholder from "../../assets/poster.png";

function timeToMinutes(timeStr) {
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
        <p>{title}</p>
        <dl>
          <dt>Ano</dt>
          <dd>{releaseYear}</dd>
          <dt>Duração</dt>
          <dd>{timeToMinutes(duration)} min</dd>
          <dt>Categorias</dt>
          <dd>{categories.split(",")[0].trim()}</dd>
        </dl>
        <p>{synopsis}</p>
      </div>
    </article>
  );
}

export default function Movies() {
  const [moviesList, setMoviesList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await movies();
      console.log(data);
      setMoviesList(data);
    };

    fetchData();
  }, []);
  return (
    <>
      <section>
        <h2 className={commonStyles.sectionTitle}>Catálogo de Filmes</h2>
        <div className={styles.gridView}>
          {moviesList.map((el) => (
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
      </section>
    </>
  );
}
