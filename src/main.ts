// TODO: ДОБАВИТЬ ВЕБВОРКЕРЫ ДЛЯ ШАХМАТ И СЯНЦИ
import { createApp } from 'vue'
import './styles/main.scss'
import './styles/auxiliary.scss'
import './styles/keyframes.scss'
import App from './App.vue'
import { i18n } from './i18n'
import { MDXProvider } from '@mdx-js/vue'

// Регистрируем глобальные компоненты для иконок
import UpdateIcon from '@/assets/images/flat_icons/flat_update.svg'
import ReloadIcon from '@/assets/images/flat_icons/flat_reload.svg'
import StartIcon from '@/assets/images/flat_icons/flat_start.svg'
import PauseIcon from '@/assets/images/flat_icons/flat_pause.svg'
import RobotIcon from '@/assets/images/flat_icons/flat_robot.svg'
import VisibilityIcon from '@/assets/images/flat_icons/flat_visibility_2.svg'
import UnicodeLogo from '@/assets/images/flat_icons/unicode_logo.svg'
import TimeIcon from '@/assets/images/flat_icons/flat_time.svg'
import ArrowIcon from '@/assets/images/flat_icons/flat_arrow.svg'
import CloseIcon from '@/assets/images/flat_icons/flat_close.svg'
import CopyLinkIcon from '@/assets/images/flat_icons/flat_copy_link.svg'
// --- END ---

const app = createApp(App)

app.use(i18n)

// Регистрация глобальных компонентов для иконок
app.component('UpdateIcon', UpdateIcon)
app.component('ReloadIcon', ReloadIcon)
app.component('StartIcon', StartIcon)
app.component('PauseIcon', PauseIcon)
app.component('RobotIcon', RobotIcon)
app.component('VisibilityIcon', VisibilityIcon)
app.component('UnicodeLogo', UnicodeLogo)
app.component('TimeIcon', TimeIcon)
app.component('ArrowIcon', ArrowIcon)
app.component('CloseIcon', CloseIcon)
app.component('CopyLinkIcon', CopyLinkIcon)
// --- END ---

// Регистрация глобального компонента для MDXProvider
app.component('MdxVueProvider', MDXProvider)

app.mount('#app')
