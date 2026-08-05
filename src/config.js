const config = {
    api_domain: {
        url_base: import.meta.env.VITE_URL_BASE,
        url_apigateway: import.meta.env.VITE_URL_APIGATEWAY,
    }, 
    aws: {
        redirect_uri: "http://localhost:3001"
    }
}

export default config