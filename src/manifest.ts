import fs from 'fs-extra'
import { r } from '../scripts/utils'

const getManifest = () => {
  return {
    manifest_version: 3,
    name: 'Getting Started Example',
    description: 'Build an Extension!',
    version: '1.0',
    action: {
      default_popup: './dist/popup/index.html'
    },
    permissions: ['identity'],
    oauth2: {
      client_id: '856415482516-0k4s97593r6e21gat3o35qukg6v0m57k.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/userinfo.email']
    }
  }
}

function writeManifest() {
  fs.writeJSON(r('extension/manifest.json'), getManifest(), { spaces: 2 })
}

writeManifest()
// 1073785853639 - 0d3l19ijnqu13otg5md80c03gdvepd1j.apps.googleusercontent.com
