import fs from 'fs-extra'
import { r } from '../scripts/utils'

const getManifest = () => {
  return {
    manifest_version: 3,
    name: 'SEARCHISTORY',
    description: 'manage search history',
    version: '1.0',
    icons: {
      "16": "image/shicon16.png",
      "48": "image/shicon48.png",
      "128": "image/shicon128.png",
    },
    action: {
      default_popup: './dist/popup/index.html',
      default_icon: "image/shicon128.png"
    },
    background: {
      "service_worker": "event.js"
    },
    permissions: ['contextMenus', "storage", "activeTab"]
  }
}
function writeManifest() {
  fs.writeJSON(r('extension/manifest.json'), getManifest(), { spaces: 2 })
}

writeManifest()
