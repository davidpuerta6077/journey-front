import { useEffect, useState } from 'react';
import { GetServiceAuth } from '../../../services/GetServiceAuth';
import '../../../styles/global/EnConstruccion.css';

export default function IntegracionApis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await GetServiceAuth('users/test');
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="integracion-container">
      <h2>Integración — Estado de APIs</h2>

      {loading && <p>Consultando API...</p>}

      {!loading && data?.error === false && (
        <div className="status-card status-ok">
          <span className="status-dot"></span>
          <div>
            <strong>Conexión exitosa</strong>
            <p>{data.body.test_message}</p>
            <small>Status: {data.status}</small>
          </div>
        </div>
      )}

      {!loading && (data === null || data?.error === true) && (
        <div className="status-card status-error">
          <span className="status-dot"></span>
          <div>
            <strong>Error de conexión</strong>
            <p>No se pudo conectar con la API</p>
          </div>
        </div>
      )}
    </div>
  );
}