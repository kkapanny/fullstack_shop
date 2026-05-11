import { useEffect, useState } from 'react';
import { api } from '../../api';
import '../ProductsPage/ProductsPage.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }

  async function setBlocked(id, isBlocked) {
    const action = isBlocked ? 'Заблокировать' : 'Разблокировать';
    if (!window.confirm(`${action} пользователя?`)) return;
    try {
      const user = users.find((u) => u.id === id);
      await api.updateUser(id, { ...user, is_blocked: isBlocked });
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Ошибка изменения статуса');
    }
  }

  async function changeRole(id, role) {
    try {
      const user = users.find((u) => u.id === id);
      await api.updateUser(id, { ...user, role });
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Ошибка изменения роли');
    }
  }

  async function removeUser(id) {
    if (!window.confirm('Удалить пользователя навсегда?')) return;
    try {
      await api.removeUser(id);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Ошибка удаления');
    }
  }

  return (
    <>
      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Почта</th>
                <th>Роль</th>
                <th>Бан</th>
                <th className="users-table__delete-col"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select value={user.role} onChange={(event) => changeRole(user.id, event.target.value)}>
                      <option value="buyer">покупатель</option>
                      <option value="seller">продавец</option>
                      <option value="admin">админ</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`btn btn-small ${user.is_blocked ? 'btn-primary' : 'btn-danger'}`}
                      onClick={() => setBlocked(user.id, !user.is_blocked)}
                    >
                      {user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                  </td>
                  <td className="users-table__delete-col">
                    <button
                      className="icon-btn-danger"
                      onClick={() => removeUser(user.id)}
                      aria-label="Удалить пользователя"
                      title="Удалить пользователя"
                    >
                      <img src="/delete-user.png" alt="" aria-hidden="true" className="icon-btn-danger__img" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
