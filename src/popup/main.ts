import { createApp } from 'vue'
import App from './Popup.vue'

import mavonEditor from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'

createApp(App).use(mavonEditor).mount("#app");
