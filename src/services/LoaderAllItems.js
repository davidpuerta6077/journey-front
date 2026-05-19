import axios from 'axios';
import config from "../config"

const LoaderAllItems = async (detail, link) => {
    try {
        const url = (config.api_domain.url_base)
        const res = await axios.get(url)
        detail(res.data.body)
        
    } catch (error) {
        console.error(error);
        detail('null');
    }
    return detail
}

export default LoaderAllItems