import { useEffect, useState } from "react";
import axios from "axios";
 
const useFetch = (endpoint, query) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.request({
                method: 'GET',
                url: `https://jsearch.p.rapidapi.com/${endpoint}`,
                params: {...query},
                headers: {
                  'x-rapidapi-key': "24374f12e6msh26f2cbe65ac5c0fp17a031jsn06259ab3edac",
                  'x-rapidapi-host': 'jsearch.p.rapidapi.com'
                }
              });
            setData(response.data.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const refetch = () => {
        setLoading(true);
        fetchData();
    };

    return { data, loading, error, refetch };
}

export default useFetch;