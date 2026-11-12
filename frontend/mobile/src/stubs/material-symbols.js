// Заглушка вместо @expo-google-fonts/material-symbols (см. metro.config.js).
// expo-router тянет его через expo-symbols, и в APK попадали 18 шрифтов (~19 МБ).
// В приложении SymbolView не используется: иконки — lucide-react-native.
const stub = { __esModule: true, useFonts: () => [true, null], default: {} };
module.exports = new Proxy(stub, { get: (target, key) => (key in target ? target[key] : 0) });
