// Dirección de la API: en producción es la de API Gateway (Journey API), que reenvía a ECS.
// Se toma de VITE_API_URL (.env o variables del despliegue).
const apiUrl = import.meta.env.VITE_API_URL;

const config = {
    api_domain: {
        url_base: apiUrl,
        url_apigateway: apiUrl,
    }, 
    // aws: {
    //     redirect_uri: "http://localhost:5173",
    //     backend_uri: apiUrl,
    // }
    aws: {
        redirect_uri: "https://bravohub.pascualbravovirtual.edu.co",
        backend_uri: apiUrl,
    }
}

export default config
