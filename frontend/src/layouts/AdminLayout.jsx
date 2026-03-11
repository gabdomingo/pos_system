import React from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';

export default function AdminLayout({ auth, onLogout }) {
  return (
    <div className="app-container admin-layout">
      <Sidebar auth={auth} onLogout={onLogout} />
      <div className="main-content admin-main">
        <Topbar auth={auth} onLogout={onLogout} />
        <div className="page admin-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
