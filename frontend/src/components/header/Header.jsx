import './header.css'
import SvgLogo from '../svg-as-code/SvgLogo.jsx'

function HeaderLink({ icon, title, href }) {
    return (
        <>
        </>
    )
}

function Header() {
    return (
        <header>
            <div className='container'>
                <div className='logo'>
                    <SvgLogo size={48}/>
                    <h1>Filminis</h1>
                </div>
                <nav>
                    <ul>

                    </ul>
                </nav>
            </div>
        </header>
    )
}

export default Header