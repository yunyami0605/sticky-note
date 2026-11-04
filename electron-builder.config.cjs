/** @type {import('electron-builder').Configuration} */
const config = {
  appId: 'com.seculayer.sticky-note',
  productName: 'Sticky Note',
  copyright: 'Copyright © 2026 seculayer',
  directories: {
    buildResources: 'resources',
    output: 'dist',
  },
  files: [
    'out/**/*',
    '!out/**/*.map',
  ],
  mac: {
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
    category: 'public.app-category.productivity',
    icon: 'resources/icon.icns',
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'resources/icon.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerLanguages: ['ko_KR', 'en_US'],
    language: '1042',
  },
}

module.exports = config
