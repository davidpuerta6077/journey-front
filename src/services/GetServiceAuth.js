import axios from 'axios';
import config from '../config';
import awsAuth from './AwsAuthService';


const domain = config.aws.backend_uri;

export const GetServiceAuth = async (endpoint) => {
    try {
        const token = awsAuth.getToken();
        const url = `${domain}/${endpoint}`;
        // Sin timeout, si la API se queda colgada (BD/túnel caído) la app
        // queda en el loader para siempre en vez de reintentar/mostrar error.
        const res = await axios.get(url, {
           timeout: 15000,
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`,
           }
        });

        return res.data;

    } catch (error) {
        console.error("Error en GetServiceAuth:", error.message);
        return null;
    }
}