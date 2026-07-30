import { useEffect, useState } from 'react';
import EnConstruccion from '../../../components/EnConstruccion';
import { GetServiceAuth } from '../../../services/GetServiceAuth.js';

export default function IntegracionApis() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await GetServiceAuth('users/test');
      setData(result);
    };
    fetchData();
  }, []);

  return (
    <div>
      <EnConstruccion titulo="Integración — Estado de APIs" />
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}