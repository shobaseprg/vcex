import fs from 'fs-extra'
import { r } from '../scripts/utils'

const getManifest = () => {
  return {
    manifest_version: 3,
    name: 'SEARCHIST',
    description: 'Build an Extension!',
    version: '1.0',
    action: {
      default_popup: './dist/popup/index.html'
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
