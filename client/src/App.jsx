import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';
import ChatPage from './pages/ChatPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
