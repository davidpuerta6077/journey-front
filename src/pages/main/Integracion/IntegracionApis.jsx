import { useEffect, useState } from 'react';
import { Server, Database, KeyRound, ShieldCheck, Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { GetServiceAuth } from '../../../services/GetServiceAuth';
import '../../../styles/main/Integracion/IntegracionApis.css';

const ENDPOINTS_TO_TEST = [
  { key: 'test_api',           label: 'API básica',                icon: Server,      endpoint: 'test/test_api' },
  { key: 'test_bd_conection',  label: 'Conexión a Base de Datos',  icon: Database,    endpoint: 'test/test_bd_conection' },
  { key: 'test_auth',          label: 'Autenticación (checkAuth)', icon: KeyRound,    endpoint: 'test/test_auth' },
  { key: 'test_module_access', label: 'Acceso a Módulo',           icon: ShieldCheck, endpoint: 'test/test_module_access' },
  { key: 'test_full_secure',   label: 'Seguridad Completa',        icon: Lock,        endpoint: 'test/test_full_secure' },
];

export default function IntegracionApis() {
  const [results, setResults] = useState({});

  useEffect(() => {
    ENDPOINTS_TO_TEST.forEach(async (test) => {
      setResults((prev) => ({ ...prev, [test.key]: { loading: true } }));

      const inicio = performance.now();
      const result = await GetServiceAuth(test.endpoint);

      setResults((prev) => ({
        ...prev,
        [test.key]: { loading: false, data: result, ms: Math.round(performance.now() - inicio) },
      }));
    });
  }, []);

  const terminados = ENDPOINTS_TO_TEST.filter((t) => results[t.key] && !results[t.key].loading);
  const operativos = terminados.filter((t) => results[t.key].data?.error === false).length;
  const conError = terminados.length - operativos;

  return (
    <div className="sync-page api-status-page">
      <div className="sync-page-header">
        <div>
          <h2>Integración — Estado de APIs</h2>
          <p className="api-status-subtitle">Verificación de los servicios del backend de Nexo</p>
        </div>
        <div className={`api-status-summary ${conError ? 'is-error' : terminados.length < ENDPOINTS_TO_TEST.length ? 'is-loading' : 'is-ok'}`}>
          {terminados.length < ENDPOINTS_TO_TEST.length
            ? <><Loader2 size={16} className="api-status-spin" /> Verificando servicios…</>
            : conError
              ? <><XCircle size={16} /> {conError} servicio{conError === 1 ? '' : 's'} con error</>
              : <><CheckCircle2 size={16} /> Todos los servicios operativos</>}
          <span className="api-status-summary-count">{operativos}/{ENDPOINTS_TO_TEST.length}</span>
        </div>
      </div>

      <div className="api-status-grid">
        {ENDPOINTS_TO_TEST.map((test) => {
          const result = results[test.key];
          const cargando = !result || result.loading;
          const ok = !cargando && result.data?.error === false;
          const estado = cargando ? 'loading' : ok ? 'ok' : 'error';
          const Icono = test.icon;

          return (
            <article key={test.key} className={`api-status-card is-${estado}`}>
              <header className="api-status-card-header">
                <span className="api-status-icon"><Icono size={20} /></span>
                <div className="api-status-titles">
                  <h3>{test.label}</h3>
                  <code>/{test.endpoint}</code>
                </div>
                <span className={`api-status-badge is-${estado}`}>
                  {cargando ? <Loader2 size={13} className="api-status-spin" /> : <span className="api-status-dot" />}
                  {cargando ? 'Verificando' : ok ? 'Operativo' : 'Error'}
                </span>
              </header>

              {cargando ? (
                <div className="api-status-skeleton"><span /><span /></div>
              ) : (
                <>
                  <p className="api-status-message">
                    {ok
                      ? (result.data.body?.test_message || JSON.stringify(result.data.body))
                      : (result.data?.message || 'No se pudo conectar con la API')}
                  </p>
                  <footer className="api-status-meta">
                    {ok && <span>HTTP {result.data.status}</span>}
                    <span>{result.ms} ms</span>
                  </footer>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
