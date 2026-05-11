import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api';
import LoginPage from './pages/LoginPage/LoginPage';
import ProductCardPage from './pages/ProductCardPage/ProductCardPage';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';

function ProtectedRoute({ children }) {
  if (!api.getAccessToken()) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/product/:id"
          element={(
            <ProtectedRoute>
              <ProductCardPage />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
