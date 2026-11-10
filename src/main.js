import { createWireview } from './library.js';
import './standalone.css';
const viewer = createWireview(document.getElementById('app'), { assetsBaseUrl: new URL(import.meta.env.BASE_URL, location.href).href });
window.addEventListener('pagehide', () => viewer.destroy(), { once: true });
