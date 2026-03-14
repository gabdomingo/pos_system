import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import ProductsPage from './components/ProductsPage';
import SalesPage from './components/SalesPage';
import CustomerApp from './components/CustomerApp';
import Login from './components/Login';
import Register from './components/Register';

function getStoredAuth() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { token, user };
  } catch (e) {
    return { token: null, user: null };
  }
}

function getCurrentPath() {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

function isAdminPath(path) {
  return path === '/admin-dashboard' || path === '/admin' || path.startsWith('/admin/');
}

function isCashierPath(path) {
  return path === '/cashier' || path.startsWith('/cashier/');
}

function isCustomerPath(path) {
  return path === '/' || path === '/customer' || path === '/customer-dashboard' || path.startsWith('/customer/');
}

function pageFromPath(path) {
  if (path.includes('/products')) return 'products';
  if (path.includes('/sales')) return 'sales';
  if (path.includes('/pos')) return 'pos';
  return 'dashboard';
}

function adminPathForPage(page) {
  if (page === 'products') return '/admin/products';
  if (page === 'sales') return '/admin/sales';
  if (page === 'pos') return '/admin/pos';
  return '/admin-dashboard';
}

function initialModeFor(path, auth, forceCustomer) {
  if (forceCustomer) return 'customer';
  if (isCashierPath(path)) return 'cashier';
  if (isAdminPath(path)) return 'admin';
  if (isCustomerPath(path)) return 'customer';
  if (auth?.user?.role === 'cashier') return 'cashier';
  if (auth?.user?.role === 'admin') return 'admin';
  return 'customer';
}

export default function App() {
  const initAuth = getStoredAuth();
  const initPath = getCurrentPath();
  const initialPage = pageFromPath(initPath);
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const forceCustomer = urlParams?.get('view') === 'customer';

  const [path, setPath] = useState(initPath);
  const [page, setPage] = useState(initialPage);
  const [mode, setMode] = useState(initialModeFor(initPath, initAuth, forceCustomer));
  const [auth, setAuth] = useState(initAuth);
  const [toast, setToast] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [page, mode]);

  useEffect(() => {
    const handler = (event) => {
      const msg = event?.detail?.message || event?.detail || 'Updated';
      setToast(msg);
      window.setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPath(getCurrentPath());
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((nextPath, options = {}) => {
    if (typeof window === 'undefined') return;
    const replace = Boolean(options.replace);
    if (window.location.pathname !== nextPath) {
      if (replace) {
        window.history.replaceState({}, '', nextPath);
      } else {
        window.history.pushState({}, '', nextPath);
      }
    }
    setPath(nextPath);
  }, []);

  useEffect(() => {
    if (isCashierPath(path)) {
      setMode('cashier');
      setPage('pos');
      return;
    }
    if (isAdminPath(path)) {
      setMode('admin');
      setPage(pageFromPath(path));
      return;
    }
    if (isCustomerPath(path)) {
      setMode('customer');
    }
  }, [path]);

  useEffect(() => {
    if (!auth?.user || forceCustomer) return;
    if (auth.user.role === 'cashier' && !isCashierPath(path)) {
      setMode('cashier');
      setPage('pos');
      navigate('/cashier', { replace: true });
    }
  }, [auth?.user, forceCustomer, navigate, path]);

  function goToAdminPage(nextPage) {
    setPage(nextPage);
    navigate(adminPathForPage(nextPage));
  }

  function doLogin({ token, user }) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({ token, user });

    if (user.role === 'admin') {
      setMode('admin');
      setPage('dashboard');
      navigate('/admin-dashboard', { replace: true });
      return;
    }

    if (user.role === 'cashier') {
      setMode('cashier');
      setPage('pos');
      navigate('/cashier', { replace: true });
      return;
    }

    setMode('customer');
    navigate('/customer-dashboard', { replace: true });
  }

  function doLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null });
    setMode('customer');
    setPage('dashboard');
    navigate('/', { replace: true });
  }

  if (path === '/login') {
    return <Login onLogin={doLogin} onNavigate={navigate} />;
  }

  if (path === '/register') {
    return <Register onRegister={doLogin} onNavigate={navigate} />;
  }

  if (mode === 'cashier') {
    if (!auth?.user || auth.user.role !== 'cashier') {
      return <Login onLogin={doLogin} onNavigate={navigate} />;
    }

    return (
      <div>
        <POS auth={auth} cashierMode onLogout={doLogout} />
        <div className={`app-toast ${toast ? 'show' : ''}`}>{toast}</div>
      </div>
    );
  }

  if (mode === 'admin') {
    if (!auth?.user || auth.user.role !== 'admin') {
      return <Login onLogin={doLogin} onNavigate={navigate} />;
    }

    return (
      <div className="app-container">
        <Sidebar
          page={page}
          setPage={goToAdminPage}
          mode={mode}
          setMode={setMode}
          auth={auth}
          onLogout={doLogout}
          onNavigate={navigate}
        />
        <div className="main-content" ref={mainRef}>
          {page === 'dashboard' && <Dashboard auth={auth} onLogout={doLogout} />}
          {page === 'pos' && <POS auth={auth} onLogout={doLogout} />}
          {page === 'products' && <ProductsPage auth={auth} onLogout={doLogout} />}
          {page === 'sales' && <SalesPage auth={auth} onLogout={doLogout} />}
        </div>
        <div className={`app-toast ${toast ? 'show' : ''}`}>{toast}</div>
      </div>
    );
  }

  return (
    <div>
      <CustomerApp setMode={setMode} auth={auth} onLogout={doLogout} onNavigate={navigate} />
      <div className={`app-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
