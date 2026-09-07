'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('yalfal_admin_token') || '';
    try {
      const res = await api.getAdminUsers(token, { search: search.trim() || undefined });
      setUsers(res.users);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const token = localStorage.getItem('yalfal_admin_token') || '';
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateUserStatus(token, id, newStatus);
      loadUsers();
    } catch (err) {
      alert('Error updating user status');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-0">Platform Users</h3>
          <p className="text-muted small mb-0">
            Registered Telegram participants and account statuses.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadUsers();
          }}
          className="d-flex gap-2"
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search user / telegram ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-navy">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center bg-white">
          <p className="text-muted mb-0">No users found.</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th>Telegram ID</th>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Tickets</th>
                  <th>Payments</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-monospace fw-bold text-navy">{u.telegramId}</td>
                    <td>{u.username ? `@${u.username}` : '—'}</td>
                    <td>{u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—'}</td>
                    <td>
                      <span className="badge bg-light text-navy border">{u._count?.tickets || 0}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-navy border">{u._count?.payments || 0}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="small text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
