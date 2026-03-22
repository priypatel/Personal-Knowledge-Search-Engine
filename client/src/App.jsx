import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
                fontSize: '18px',
              }}
            >
              Knowbase — Phase 1 complete
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
