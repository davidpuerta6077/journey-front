// Castor para Campus Bebras: lucide-react no trae uno, así que se dibuja con el
// mismo estilo (24x24, trazo currentColor de 2px redondeado) para que se vea
// igual que los demás íconos del menú. Cara de frente con los dientes: de perfil
// no se reconoce a 16px.
const BeaverIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="13" r="8" />
    <circle cx="5.5" cy="6" r="2" />
    <circle cx="18.5" cy="6" r="2" />
    <path d="M9 11h.01M15 11h.01" />
    <path d="M11 14h2" />
    <path d="M10.5 16.5v3h3v-3M12 16.5v3" />
  </svg>
)

export default BeaverIcon
