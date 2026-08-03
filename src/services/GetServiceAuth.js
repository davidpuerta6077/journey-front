import axios from 'axios';
import config from '../config';
import awsAuth from './AwsAuthService';

const domain = `https://ominous-spork-wxvr56gqgqxh56xj-3001.app.github.dev`;

export const GetServiceAuth = async (endpoint) => {
    try {
        const token = awsAuth.getToken();
        const email = awsAuth.getEmail();
        const url = `${domain}/${endpoint}`;

        const res = await axios.get(url, {
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