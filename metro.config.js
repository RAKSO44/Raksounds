// Configuración de Metro: la de Expo, más `.flac` como asset.
//
// El banco de piano va en FLAC (ver scripts/build-piano-samples.mjs): a
// diferencia del MP3 no trae silencio de códec al inicio, así que cada nota
// suena justo cuando se programa. Metro no lo incluye entre sus assets por
// defecto. Jest necesita la misma extensión en package.json ("jest.transform").
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('flac');

module.exports = config;
