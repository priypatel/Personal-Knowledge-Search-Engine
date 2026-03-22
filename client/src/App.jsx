import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';
import Upload from './components/Upload/Upload.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-surface font-sans flex flex-col items-center justify-center px-xl">
              <h1 className="text-2xl font-semibold text-base mb-xl tracking-tight">
                Knowbase
              </h1>
              <div className="w-full max-w-lg">
                <Upload onUploadSuccess={(res) => console.log('Uploaded:', res)} />
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
