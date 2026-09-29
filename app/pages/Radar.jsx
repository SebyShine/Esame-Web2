import { useEffect, useState } from 'react';
import StoryCard from '../components/StoryCard.jsx';
import { getTopStoriesDetailed } from '../services/api.js';
import { isReadLater, toggleReadLater } from '../services/storage.js';

/**
 * Pagina Radar con le top stories di Hacker News.
 * @returns {React.JSX.Element} - Componente Radar.
 */
function Radar() {
  const [total, setTotal] = useState(24);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState('loading');
  const [stories, setStories] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTopStories() {
      setStatus('loading');

      try {
        const result = await getTopStoriesDetailed({ total, batchSize: 12 });

        if (cancelled) {
          return;
        }

        if (!result.length) {
          setStatus('empty');
          return;
        }

        setStories(result);
        setStatus('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        /*@ts-ignore*/
        setErrorMessage(error.message || 'Impossibile caricare il radar.');
        setStatus('error');
      }
    }

    loadTopStories();

    return () => {
      cancelled = true;
    };
  }, [total, reloadKey]);

  const totalScore = stories.reduce((sum, story) => sum + (story.score || 0), 0);
  const totalComments = stories.reduce((sum, story) => sum + (story.descendants || 0), 0);
  const hottest = [...stories].sort((left, right) => (right.score || 0) - (left.score || 0))[0];
  const mostDiscussed = [...stories].sort(
    (left, right) => (right.descendants || 0) - (left.descendants || 0)
  )[0];

  return (
    <>
      <section className="page-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Radar</p>
            <h3>Scorri le storie più interessanti e apri quella che vuoi leggere</h3>
            <p className="section-subtitle">
              Ogni riga porta al focus della story, così puoi passare dalla panoramica alla lettura
              senza passaggi inutili.
            </p>
          </div>
        </div>

        {/* TODO 2: Mancano le classi per alcuni elementi di questo gruppo di controlli. Cercale negli altri file e trova le classi corrette da applicare */}
        <div className="controls-bar">
          <div className="controls-group">
            <div className="field">
              <label htmlFor="top-limit-select">Quante storie vuoi vedere</label>
              <select
                id="top-limit-select"
                value={total}
                onChange={(event) => setTotal(Number(event.target.value))}
              >
                <option value="12">12 storie</option>
                <option value="18">18 storie</option>
                <option value="24">24 storie</option>
                <option value="36">36 storie</option>
              </select>
            </div>
          </div>
          <button
            id="top-refresh-button"
            className="btn btn-primary"
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Aggiorna radar
          </button>
        </div>

        <div id="top-summary" className="archive-summary">
          {status === 'loading' && <div className="state-panel loading">Compongo il radar...</div>}
          {status === 'error' && (
            <div className="state-panel error">
              <strong>Errore</strong>
              <p>{errorMessage}</p>
            </div>
          )}
          {status === 'empty' && (
            <div className="state-panel empty">Nessuna story disponibile al momento.</div>
          )}
          {status === 'ready' && (
            <>
              <div className="stat-card">
                <span className="stat-label">Story nel feed</span>
                <strong className="stat-value">{stories.length}</strong>
                <p className="stat-note">Volume selezionato dal radar.</p>
              </div>
              <div className="stat-card">
                <span className="stat-label">Score totale</span>
                <strong className="stat-value">{totalScore}</strong>
                <p className="stat-note">Concentrazione del feed.</p>
              </div>
              <div className="stat-card">
                <span className="stat-label">Commenti totali</span>
                <strong className="stat-value">{totalComments}</strong>
                <p className="stat-note">Indice della conversazione.</p>
              </div>
              <div className="stat-card">
                <span className="stat-label">Più calda</span>
                <strong className="stat-value">{hottest ? hottest.score : 0}</strong>
                <p className="stat-note">{hottest ? hottest.title : 'N/D'}</p>
              </div>
              <div className="stat-card">
                <span className="stat-label">Più discussa</span>
                <strong className="stat-value">
                  {mostDiscussed ? mostDiscussed.descendants : 0}
                </strong>
                <p className="stat-note">{mostDiscussed ? mostDiscussed.title : 'N/D'}</p>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="page-section" id="top-feed-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Lista</p>
            <h3>Storie in evidenza</h3>
          </div>
        </div>
        <div id="top-feed-root" className="story-list">
          {status === 'loading' && <div className="state-panel loading">Carico la galleria...</div>}
          {status === 'error' && (
            <div className="state-panel error">
              <strong>Errore</strong>
              <p>{errorMessage}</p>
            </div>
          )}
          {status === 'empty' && (
            <div className="state-panel empty">Nessuna story disponibile al momento.</div>
          )}
          {status === 'ready' &&
            stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                showActions
                showThreadButton={false}
                feedVariant="list"
                isSaved={isReadLater(story.id)}
                onToggleSave={(target) => toggleReadLater(target.id)}
              />
            ))}
        </div>
      </section>
    </>
  );
}

export default Radar;
