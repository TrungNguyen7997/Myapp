import axios from 'axios';

export default axios.create({
    baseURL: 'https://ssl.aquasoft.vn/',
    headers: {
        'Content-Type': 'application/json'
    },
})