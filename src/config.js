const config = {
    api_domain: {
        url_base: import.meta.env.VITE_URL_BASE,
        url_apigateway: import.meta.env.VITE_URL_APIGATEWAY,
    }, 
    // aws: {
    //     redirect_uri: "http://localhost:5173",
    //     backend_uri: "http://localhost:3001",
    // }
    aws: {
        redirect_uri: "https://bravohub.pascualbravovirtual.edu.co",
        backend_uri: "https://ywjmda93pu.us-east-1.awsapprunner.com",
    }
    // aws: {
    //     redirect_uri: "https://journey.pascualbravovirtual.edu.co/",
    //     backend_uri: "https://ywjmda93pu.us-east-1.awsapprunner.com/",
    // }
}

export default config