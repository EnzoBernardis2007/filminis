import styles from './profile.module.css'
import commonStyles from '../../app.module.css'

export default function Profile() {
    return (
        <div className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter}`}>
            <div
                style={{width: 640}}
            >
                <p>oi</p>
            </div>
        </div>
    )
}