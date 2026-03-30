import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProductCardPage from './pages/ProductCardPage/ProductCardPage';
import ProductsPage from './pages/ProductsPage/ProductsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductCardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
