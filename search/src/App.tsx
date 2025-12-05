import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-placeholder" aria-hidden="true">
          Logo
        </div>
        <div className="brand-text">
          The Brandon Wilcox Home Group at 616 Realty
        </div>
      </header>

      <main className="app-main">
        <section className="search-controls" aria-label="Search controls">
          <div className="controls-grid">
            <input type="text" placeholder="Location" />
            <input type="number" placeholder="Price min" />
            <input type="number" placeholder="Price max" />
            <input type="number" placeholder="Beds" />
            <input type="number" placeholder="Baths" />
            <button type="button">Search</button>
          </div>
        </section>

        <section className="content-split">
          <div className="map-pane">
            <div className="placeholder-text">Map area placeholder</div>
          </div>
          <div className="results-pane">
            <div className="placeholder-card">
              Results list placeholder
              <p>Listings will show up here once the search is connected.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        © The Brandon Wilcox Home Group – Project X beta
      </footer>
    </div>
  )
}

export default App
