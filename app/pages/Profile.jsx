import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import RecordsTable from '../components/RecordsTable.jsx';
import { getUserSubmittedItems } from '../services/api.js';
import { stripHtml } from '../utils/text.js';

function getInitial(userId) {
  return (
    String(userId || '?')
      .trim()
      .slice(0, 1)
      .toUpperCase() || '?'
  );
}

function formatActivityTitle(item) {
  const titleText = item.title || '';
  const textSnippet = stripHtml(item.text || '').trim();
  const fallback = titleText || textSnippet || (item.url ? item.url : '');
  return fallback ? fallback.slice(0, 96) : 'N/D';
}

/**
 * Pagina Profilo/Autori: dati profilo e ultime submission.
 * @returns {React.JSX.Element} - Componente Profile.
 */
function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUser = searchParams.get('user') || '';
  const [inputValue, setInputValue] = useState(initialUser);
  const [userId, setUserId] = useState(initialUser);
  const [status, setStatus] = useState(initialUser ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setStatus('loading');

      try {
        const result = await getUserSubmittedItems(userId, 10);

        if (cancelled) {
          return;
        }

        setUser(result.user);
        setItems(result.items);
        setStatus('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        /*@ts-ignore*/
        setErrorMessage(error.message || 'Impossibile recuperare il profilo.');
        setStatus('error');
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function handleLoad() {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setStatus('missing-input');
      return;
    }

    setSearchParams({ user: trimmed });
    setUserId(trimmed);
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleLoad();
    }
  }

  return (
    <>
      <section className="page-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Autori</p>
            <h3>Profilo e attività di un utente</h3>
            <p className="section-subtitle">
              Recupera i dettagli di un profilo Hacker News e le sue ultime submission in una vista
              più editoriale.
            </p>
          </div>
        </div>

        <div className="controls-bar">
          <div className="controls-group">
            <div className="field">
              <label htmlFor="user-id-input">Username</label>
              <input
                id="user-id-input"
                type="text"
                placeholder="es. pg"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <button
            id="load-user-button"
            className="btn btn-primary"
            type="button"
            onClick={handleLoad}
          >
            Carica autore
          </button>
        </div>
      </section>

      <section className="page-section profile-layout">
        <div id="profile-root">
          {status === 'idle' && (
            <div className="state-panel empty">
              Inserisci uno username per visualizzare il profilo.
            </div>
          )}
          {status === 'missing-input' && (
            <div className="state-panel error">
              <strong>Input mancante</strong>
              <p>Inserisci uno username Hacker News.</p>
            </div>
          )}
          {status === 'loading' && <div className="state-panel loading">Carico il profilo...</div>}
          {status === 'error' && (
            <div className="state-panel error">
              <strong>Errore</strong>
              <p>{errorMessage}</p>
            </div>
          )}
          {status === 'ready' && user && (
            <article className="profile-hero">
              <div className="profile-avatar">{getInitial(user.id)}</div>
              <div className="profile-summary">
                <p className="eyebrow">Profilo autore</p>
                <h2 className="profile-title">{user.id}</h2>
                <p className="profile-about">
                  {stripHtml(user.about || '').trim() ||
                    'Nessuna bio pubblica disponibile per questo autore.'}
                </p>
                <div className="profile-meta-grid">
                  <div className="profile-stat">
                    <label>Karma</label>
                    <strong>{user.karma}</strong>
                    <p>Punteggio complessivo del profilo.</p>
                  </div>
                  <div className="profile-stat">
                    <label>Creato il</label>
                    <strong>{user.createdLabel || 'N/D'}</strong>
                    <p>Data di registrazione dell'account.</p>
                  </div>
                  <div className="profile-stat">
                    <label>Submission lette</label>
                    <strong>{items.length}</strong>
                    <p>Ultimi contenuti estratti dal feed dell'utente.</p>
                  </div>
                  <div className="profile-stat">
                    <label>Modalità</label>
                    <strong>Editoriale</strong>
                    <p>Una scheda profilo più visiva rispetto alla vista base.</p>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
        <div id="activity-root">
          {status === 'idle' && (
            <div className="state-panel empty">Le ultime attività verranno mostrate qui.</div>
          )}
          {status === 'missing-input' && (
            <div className="state-panel empty">Le ultime attività verranno mostrate qui.</div>
          )}
          {status === 'loading' && (
            <div className="state-panel loading">Carico l'attività recente...</div>
          )}
          {status === 'error' && (
            <div className="state-panel error">
              <strong>Errore</strong>
              <p>{errorMessage}</p>
            </div>
          )}
          {status === 'ready' && (
            <RecordsTable
              emptyMessage="Nessuna attività recente disponibile."
              records={items}
              columns={[
                { header: 'Tipo', render: (item) => item.type || 'N/D' },
                { header: 'Titolo', render: (item) => formatActivityTitle(item) },
                { header: 'Score', render: (item) => item.score },
                { header: 'Commenti', render: (item) => item.descendants },
                { header: 'Data', render: (item) => item.timeLabel },
              ]}
            />
          )}
        </div>
      </section>
    </>
  );
}

export default Profile;
