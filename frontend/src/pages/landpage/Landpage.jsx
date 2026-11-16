import styles from "./landpage.module.css";
import commonStyles from '../../app.module.css'
import img from "../../assets/another.png";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import posterPlaceholder from "../../assets/poster.png";
import SvgHome from '../../components/svg-as-code/SvgHome.jsx'
import SvgFilm from '../../components/svg-as-code/SvgFilm.jsx'

function Card({ image, title, year }) {
  const handleImageError = (e) => {
    e.target.src = posterPlaceholder;
  };
  return (
    <article className={styles.movieCard}>
      <img onError={handleImageError} src={image} alt={title} />
      <div>
        <p>{title}</p>
        <span>({year})</span>
      </div>
    </article>
  );
}

function Landpage() {
  const { api } = useAuth();
  const [moviesList, setMoviesList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.movies();
      console.log(data);
      setMoviesList(data);
    };

    fetchData();
  }, [api]);

  return (
    <div className={styles.center}>
      <section className={styles.introduction}>
        <h2>Todos os filmes. Em um lugar só.</h2>
        <hr />
        <p>
          O Filminis é uma biblioteca colaborativa de cinema feita por quem ama
          filmes para quem ama filmes. Nossa comunidade ativa pesquisa, organiza
          e compartilha acervos cinematográficos, conectando apaixonados pela
          sétima arte em um só lugar.
        </p>
      </section>

      <section className={`${styles.fillWidth} ${styles.section}`}>
        <h2 className={commonStyles.sectionTitle}>Populares</h2>
        <div className={styles.movieList}>
          {moviesList.slice(0, 5).map((el) => (
            <Card
              key={el.id}
              id={el.id}
              image={el.imagem}
              title={el.titulo}
              year={el.ano}
            />
          ))}
        </div>
      </section>

      <section className={`${styles.fillWidth} ${styles.section}`}>
        <div className={styles.featuredContainer}>
          <div className={styles.featuredImageWrapper}>
            <img
              src={img}
              alt="Cena do filme Matrix"
              className={styles.featuredImage}
            />
          </div>
          <div className={styles.featuredContent}>
            <h3>Maratonas que Marcadas Época</h3>
            <p>
              Explore os clássicos absolutos e os lançamentos independentes que
              mobilizaram nossa comunidade. O acervo de filmes mais assistidos
              traz obras-primas selecionadas e debatidas por cinéfilos de todo o
              mundo, garantindo que você descubra sempre a próxima grande
              história.
            </p>
            <blockquote className={styles.featuredQuote}>
              <p>
                &ldquo;O cinema não tem fronteiras nem limites, é um fluxo
                constante de sonho, memória e realidade compartilhada.&rdquo;
              </p>
              <cite>— Martin Scorsese</cite>
            </blockquote>
          </div>
        </div>
      </section>

      <section className={`${styles.fillWidth} ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Nossos valores</h2>
        <div className={styles.valuesContainer}>
          <article>
            <div>
              <SvgHome size={32} />
              <p>Colaboração</p>
            </div>
            <p>
              Construímos nossa base de dados juntos, somando o conhecimento e a
              paixão de cada membro da comunidade cinefilia.
            </p>
          </article>

          <article>
            <div>
              <SvgFilm size={32} />
              <p>Curadoria</p>
            </div>
            <p>
              Valorizamos a qualidade sobre a quantidade, organizando listas e
              acervos com critérios rigorosos de relevância artística.
            </p>
          </article>

          <article>
            <div>
              <span role="img" aria-label="paixão">❤️</span>
              <p>Paixão</p>
            </div>
            <p>
              Movidos pelo amor à sétima arte, celebramos o cinema em todas as
              suas vertentes, épocas, nacionalidades e gêneros.
            </p>
          </article>

          <article>
            <div>
              <span role="img" aria-label="liberdade">🕊️</span>
              <p>Liberdade</p>
            </div>
            <p>
              Um espaço aberto e democrático onde qualquer cinéfilo pode
              descobrir, opinar e compartilhar suas referências favoritas.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Landpage;
