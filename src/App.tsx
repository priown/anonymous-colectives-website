import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import Layout from './components/Layout'
import { CartProvider } from './context/CartContext'
import { CatalogueProvider } from './context/CatalogueContext'
import { ThemeProvider } from './context/ThemeContext'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import ManagePage from './pages/ManagePage'
import NotFoundPage from './pages/NotFoundPage'
import ProductPage from './pages/ProductPage'
import ShopPage from './pages/ShopPage'

function ProductRoute() {
  const { id } = useParams()
  return <ProductPage key={id} id={id} />
}

/** Keeps old product.html?id=ac-001 links working. */
function LegacyProductRedirect() {
  const [params] = useSearchParams()
  const id = params.get('id')
  return <Navigate to={id ? `/product/${encodeURIComponent(id)}` : '/shop'} replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <CatalogueProvider>
          <CartProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="product" element={<LegacyProductRedirect />} />
                <Route path="product/:id" element={<ProductRoute />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="manage" element={<ManagePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </CartProvider>
        </CatalogueProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
