import styles from './footer.module.css'

import svg from '../../assets/filminis.svg'

function Footer() {
    return (
        <footer className={styles.footer}>
            <div>
                <img src={svg} alt="" />
            </div>
        </footer>
    )
}

export default Footer