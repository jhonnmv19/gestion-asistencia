import React, { useState, useEffect } from 'react';

type Usuario = {
  id_perfil: number;
  id_ingreso: number;
  nombre: string;
  apellido: string;
  ci: string;
  rol: string;
  usuario_sg_ingreso: { correo_institucional: string } | null;
};

// Guardamos la URL de Render en una constante para no repetir código y facilitar cambios
const API_URL = 'https://gestion-asistencia-5xn4.onrender.com';

export function App() {
  const [vista, setVista] = useState<'marcado' | 'login' | 'admin'>('marcado');
  const [identificador, setIdentificador] = useState('');
  const [mensajeAsistencia, setMensajeAsistencia] = useState<any>(null);
  const [errorAsistencia, setErrorAsistencia] = useState('');
  
  // Estados para Login
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  
  // Estados para CRUD de Administración
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formNuevo, setFormNuevo] = useState({ correo: '', contrasenia: '', nombre: '', apellido: '', ci: '', rol: 'Estudiante' });

  // Cargar usuarios en el panel Admin
  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios`);
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  useEffect(() => {
    if (vista === 'admin') cargarUsuarios();
  }, [vista]);

  // Manejar Registro Rápido de Asistencia (Pantalla Principal)
  const manejarMarcado = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeAsistencia(null);
    setErrorAsistencia('');
    
    try {
      const res = await fetch(`${API_URL}/api/asistencia/marcar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorAsistencia(data.error || 'Ocurrió un error.');
      } else {
        setMensajeAsistencia(data);
        setIdentificador('');
      }
    } catch (err) {
      setErrorAsistencia('No se pudo conectar con el servidor.');
    }
  };

  // Manejar Login de Admin
  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasenia })
      });
      
      if (res.ok) {
        setVista('admin');
      } else {
        alert('Credenciales inválidas.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    }
  };

  // Crear nuevo usuario desde el Admin (CRUD)
  const manejarCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formNuevo)
      });
      if (res.ok) {
        alert('Usuario creado con éxito');
        setFormNuevo({ correo: '', contrasenia: '', nombre: '', apellido: '', ci: '', rol: 'Estudiante' });
        cargarUsuarios();
      } else {
        alert('Error al crear usuario.');
      }
    } catch (err) {
      alert('Error de red al intentar crear el usuario.');
    }
  };

  // Eliminar usuario (CRUD)
  const eliminarUsuario = async (id_ingreso: number) => {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      try {
        await fetch(`${API_URL}/api/usuarios/${id_ingreso}`, { method: 'DELETE' });
        cargarUsuarios();
      } catch (err) {
        alert('No se pudo eliminar el usuario.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans text-slate-800 antialiased pb-12">
      {/* Navbar Superior */}
      <header className="max-w-7xl mx-auto pt-6 px-4">
        <div className="bg-[#003c71] text-white p-6 rounded-2xl shadow-md transition-all">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">UPDS - SISTEMA DE GESTIÓN DE INGRESO</h1>
              <p className="text-xs text-blue-200/80 mt-1 font-medium tracking-wide">
                Control de Asistencia Universitaria Obligatoria e Historial de Accesos
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center">
              <button 
                onClick={() => setVista('marcado')} 
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${vista === 'marcado' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-blue-100'}`}
              >
                Marcador
              </button>
              {vista !== 'admin' ? (
                <button 
                  onClick={() => setVista('login')} 
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${vista === 'login' ? 'bg-white text-[#003c71]' : 'bg-blue-600/50 hover:bg-blue-600 text-white'}`}
                >
                  Acceso Admin
                </button>
              ) : (
                <button 
                  onClick={() => setVista('marcado')} 
                  className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* VISTA 1: INTERFAZ DE MARCADO DE TARJETA / CI */}
      {vista === 'marcado' && (
        <main className="max-w-md mx-auto mt-16 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-50 text-[#003c71] rounded-full mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Registro de Asistencia</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Por favor, ingrese su Cédula de Identidad (CI) o su Correo Institucional completo para registrar su ingreso al campus.
              </p>
            </div>
            
            <form onSubmit={manejarMarcado} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Ej: 8765432 o cb.nicolas.barrancos..." 
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003c71] focus:bg-white text-sm transition-all placeholder:text-slate-400 text-slate-900 font-medium"
                  required
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-[0.98]">
                Registrar Ingreso Oficial
              </button>
            </form>

            {mensajeAsistencia && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 animate-fadeIn">
                <div className="flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="font-bold text-sm">¡Ingreso Exitoso!</p>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p><span className="font-medium text-slate-500">Bienvenido:</span> <span className="font-semibold text-slate-800">{mensajeAsistencia.nombre}</span></p>
                  <p><span className="font-medium text-slate-500">Rol asignado:</span> <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] uppercase">{mensajeAsistencia.rol}</span></p>
                  <p><span className="font-medium text-slate-500">Hora registrada:</span> <span className="font-mono text-slate-600">{mensajeAsistencia.hora}</span></p>
                </div>
              </div>
            )}

            {errorAsistencia && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorAsistencia}</span>
              </div>
            )}
          </div>
        </main>
      )}

      {/* VISTA 2: LOGIN DE ADMINISTRADOR */}
      {vista === 'login' && (
        <main className="max-w-sm mx-auto mt-16 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
            <h2 className="text-xl font-bold text-center text-slate-900 mb-2">Autenticación de Plataforma</h2>
            <p className="text-xs text-slate-500 text-center mb-6">Área restringida para personal administrativo</p>
            
            <form onSubmit={manejarLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Correo Electrónico</label>
                <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003c71] text-sm text-slate-900 focus:bg-white outline-none" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Contraseña</label>
                <input type="password" value={contrasenia} onChange={(e) => setContrasenia(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003c71] text-sm text-slate-900 focus:bg-white outline-none" required />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#003c71] text-white font-semibold rounded-xl hover:bg-[#002850] shadow-md transition-all mt-2 text-sm">
                Entrar al Panel de Control
              </button>
            </form>
          </div>
        </main>
      )}

      {/* VISTA 3: PANEL ADMINISTRADOR CON CRUD COMPLETO */}
      {vista === 'admin' && (
        <main className="max-w-7xl mx-auto mt-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Formulario de Registro (Izquierda) */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <span className="p-1.5 bg-blue-50 text-[#003c71] rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Registrar Alumno / Personal</h3>
              </div>
              
              <form onSubmit={manejarCrearUsuario} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nombres</label>
                  <input type="text" placeholder="Ej: Juan Carlos" value={formNuevo.nombre} onChange={(e) => setFormNuevo({...formNuevo, nombre: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#003c71] focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Apellidos</label>
                  <input type="text" placeholder="Ej: Pérez Mamani" value={formNuevo.apellido} onChange={(e) => setFormNuevo({...formNuevo, apellido: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#003c71] focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cédula de Identidad (CI)</label>
                  <input type="text" placeholder="Ej: 10293847" value={formNuevo.ci} onChange={(e) => setFormNuevo({...formNuevo, ci: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#003c71] focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Correo Institucional</label>
                  <input type="email" placeholder="usuario@upds.net.bo" value={formNuevo.correo} onChange={(e) => setFormNuevo({...formNuevo, correo: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#003c71] focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Contraseña de Acceso</label>
                  <input type="password" placeholder="••••••••" value={formNuevo.contrasenia} onChange={(e) => setFormNuevo({...formNuevo, contrasenia: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#003c71] focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Rol del Sistema</label>
                  <select value={formNuevo.rol} onChange={(e) => setFormNuevo({...formNuevo, rol: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#003c71] focus:bg-white font-medium">
                    <option value="Estudiante">Estudiante</option>
                    <option value="Docente">Docente</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#003c71] hover:bg-[#002850] text-white font-bold rounded-xl shadow transition mt-4">
                  Guardar en Base de Datos
                </button>
              </form>
            </div>

            {/* Tabla de Registrados */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden">
              <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[#003c71]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wide text-sm">Listado Oficial de Estudiantes / Personal</h3>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-[#003c71] text-xs font-bold rounded-full border border-blue-100">
                  {usuarios.length} Registrados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="p-4 text-[10px]">Información del Alumno</th>
                      <th className="p-4 text-[10px]">CI</th>
                      <th className="p-4 text-[10px]">Correo Institucional</th>
                      <th className="p-4 text-[10px]">Rol</th>
                      <th className="p-4 text-[10px] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-normal italic">
                          No hay usuarios registrados en el sistema actualmente.
                        </td>
                      </tr>
                    ) : (
                      usuarios.map((u) => (
                        <tr key={u.id_perfil} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-900 text-sm">{u.nombre} {u.apellido}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">ID Perfil: #{u.id_perfil}</p>
                          </td>
                          <td className="p-4 font-mono text-slate-600 bg-slate-50/40">{u.ci}</td>
                          <td className="p-4 text-slate-500">{u.usuario_sg_ingreso?.correo_institucional || 'Sin Correo'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              u.rol === 'Administrador' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              u.rol === 'Docente' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {u.rol}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => eliminarUsuario(u.id_ingreso)} 
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-xl font-bold transition-all text-[11px]"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      )}
    </div>
  );
}

export default App;