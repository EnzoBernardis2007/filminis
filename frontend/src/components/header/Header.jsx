import { useEffect, useState } from "react";
import styles from "./header.module.css";
import commonStyles from "../../app.module.css";
import { Link } from "react-router-dom";
import SvgLogo from "../svg-as-code/SvgLogo.jsx";
import SvgHome from "../svg-as-code/SvgHome.jsx";
import SvgFilm from "../svg-as-code/SvgFilm.jsx";
import SvgLogin from "../svg-as-code/SvgLogin.jsx";
import { useAuth } from "../../contexts/useAuth";
import defaultProfilePic from "../../assets/defaultpfp.png";
import SvgPlusCircle from '../svg-as-code/SvgPlusCircle';
import SvgApproval from '../svg-as-code/SvgApproval';

function HeaderLink({ icon, title, path }) {
  return (
    <li>
      <Link to={path}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span>{title}</span>
      </Link>
    </li>
  );
}

function ProfileLink({ user }) {
  const displayName = user?.apelido || user?.nome || "Usuário";
  const profileImage =
    user?.foto && user?.foto !== "imagem" ? user.foto : defaultProfilePic;

  return (
    <Link to="/profile" className={styles.profileLink}>
      <img
        src={profileImage}
        alt={displayName}
        className={styles.profileImage}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = defaultProfilePic;
        }}
      />
      <span className={styles.profileName}>{displayName}</span>
    </Link>
  );
}

function Header() {
  const { api, isAuthenticated, isAdmin } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    async function fetchUser() {
      try {
        const userData = await api.me();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      }
    }

    fetchUser();
  }, [api, isAuthenticated]);

  const navLinks = [
    { icon: <SvgHome />, title: "Início", path: "/" },
    { icon: <SvgFilm />, title: "Filmes", path: "/movies" },
    { icon: <SvgPlusCircle />, title: "Postar", path: "/request" },
  ];

  const adminLinks = [
    { icon: <SvgApproval />, title: "Aprovações", path: "/approval" },
  ];

  return (
    <header>
      <div
        className={`${styles.container} ${commonStyles.flex} ${commonStyles.justifyBetween} ${commonStyles.itemsCenter}`}
      >
        <div className={styles.logo}>
          <SvgLogo size={48} />
          <h1>Filminis</h1>
        </div>
        <nav className={styles.navbar}>
          <ul className={commonStyles.flex}>
            {navLinks.map((link, index) => (
              <HeaderLink
                key={index}
                icon={link.icon}
                title={link.title}
                path={link.path}
              />
            ))}
            {isAdmin && adminLinks.map((link, index) => (
              <HeaderLink
                key={index}
                icon={link.icon}
                title={link.title}
                path={link.path}
              />
            ))}
            {isAuthenticated ? (
              <li>
                <ProfileLink user={user} />
              </li>
            ) : (
              <HeaderLink icon={<SvgLogin />} title="Entrar" path="/login" />
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
