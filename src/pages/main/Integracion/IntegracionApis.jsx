import { useEffect, useState } from 'react';
import { GetServiceAuth } from '../../../services/GetServiceAuth';
import '../../../styles/global/EnConstruccion.css';

const ENDPOINTS_TO_TEST = [
  { key: 'test_api',           label: 'API básica',              endpoint: 'test/test_api' },
  { key: 'test_bd_conection',  label: 'Conexión a Base de Datos', endpoint: 'test/test_bd_conection' },
  { key: 'test_auth',          label: 'Autenticación (checkAuth)', endpoint: 'test/test_auth' },
  { key: 'test_module_access', label: 'Acceso a Módulo',          endpoint: 'test/test_module_access' },
  { key: 'test_full_secure',   label: 'Seguridad Completa',       endpoint: 'test/test_full_secure' },
];

export default function IntegracionApis() {
  const [results, setResults] = useState({});

  useEffect(() => {
    ENDPOINTS_TO_TEST.forEach(async (test) => {
      setResults((prev) => ({ ...prev, [test.key]: { loading: true } }));

      const result = await GetServiceAuth(test.endpoint);

      setResults((prev) => ({
        ...prev,
        [test.key]: { loading: false, data: result },
      }));
    });
  }, []);

  return (
    <div className="integracion-container">
      <h2>Integración — Estado de APIs</h2>

      {ENDPOINTS_TO_TEST.map((test) => {
        const result = results[test.key];

        return (
          <div key={test.key} style={{ marginBottom: '1rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.3rem' }}>{test.label}</strong>

            {(!result || result.loading) && <p>Consultando API...</p>}

            {result && !result.loading && result.data?.error === false && (
              <div className="status-card status-ok">
                <span className="status-dot"></span>
                <div>
                  <strong>Conexión exitosa</strong>
                  <p>{result.data.body?.test_message || JSON.stringify(result.data.body)}</p>
                  <small>Status: {result.data.status}</small>
                </div>
              </div>
            )}

            {result && !result.loading && (result.data === null || result.data?.error === true) && (
              <div className="status-card status-error">
                <span className="status-dot"></span>
                <div>
                  <strong>Error de conexión</strong>
                  <p>{result.data?.message || 'No se pudo conectar con la API'}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}