'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const token = localStorage.getItem('yalfal_admin_token') || '';
      try {
        const res = await api.getAuditLogs(token);
        setLogs(res.logs);
      } catch (err) {
        console.error('Error loading audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-extrabold text-navy mb-0">System Audit Trail</h3>
          <p className="text-muted small mb-0">
            Immutable log of administrative operations, reviews, and draws.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center bg-white">
          <p className="text-muted mb-0">No audit entries recorded yet.</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Admin Staff</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="small text-muted font-monospace">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge bg-navy text-white">{log.action}</span>
                    </td>
                    <td className="fw-semibold text-navy">{log.entity}</td>
                    <td>{log.admin?.email || 'System'}</td>
                    <td className="small text-muted font-monospace text-truncate" style={{ maxWidth: '300px' }}>
                      {log.metadata || '—'}
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
