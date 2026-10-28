import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';

/** Render the public WriteSpace entry routes. */
export default function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
    </Routes>
  );
}
