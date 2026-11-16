import styles from './header.module.css'
import commonStyles from '../../app.module.css'
import { Link } from 'react-router-dom'
import SvgLogo from '../svg-as-code/SvgLogo.jsx'
import SvgHome from '../svg-as-code/SvgHome.jsx'
import SvgFilm from '../svg-as-code/SvgFilm.jsx'

function HeaderLink({ icon, title, path }) {
    return (
        <li>
            <Link to={path}>
                {icon && <span className={styles.icon}>{icon}</span>}
                <span>{title}</span>
            </Link>
        </li>
    )
}

function Header() {
    const navLinks = [
        { icon: <SvgHome />, title: 'Início', path: '/' },
        { icon: <SvgFilm />, title: 'Filmes', path: '/movies' },
    ]

    return (
        <header>
            <div className={`${styles.container} ${commonStyles.flex} ${commonStyles.justifyBetween} ${commonStyles.itemsCenter}`}>
                <div className={styles.logo}>
                    <SvgLogo size={48}/>
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
                    </ul>
                </nav>
            </div>
        </header>
    )
}

export default Header