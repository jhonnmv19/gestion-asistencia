import express, { Request, Response } from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient';

const app = express();

// CONFIGURACIÓN DE CORS DIRECTA (Sin variables externas para evitar errores)
app.use(cors({
  origin: (origin, callback) => {
    // Lista de dominios permitidos directamente aquí adentro
    const dominiosPermitidos = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://sg-asistencia.vercel.app' // ← Cambia esto por tu URL real de Vercel cuando la tengas
    ];

    if (!origin || dominiosPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por políticas de CORS en Producción'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- ENDPOINT 1: LOGIN DE ADMINISTRADOR ---
app.post('/api/auth/login', async (req: Request, res: Response): Promise<any> => {
    const { correo, contrasenia } = req.body;
    try {
        const { data: usuario, error } = await supabase
            .from('usuario_sg_ingreso')
            .select('*, perfil_sg_ingreso(*)')
            .eq('correo_institucional', correo)
            .eq('contrasenia', contrasenia)
            .single();

        if (error || !usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas o usuario no encontrado.' });
        }

        res.json({ message: 'Ingreso exitoso', usuario });
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// --- ENDPOINT 2: MARCAR ASISTENCIA (ESTUDIANTE / DOCENTE) ---
app.post('/api/asistencia/marcar', async (req: Request, res: Response): Promise<any> => {
    const { identificador } = req.body;
    try {
        let perfil: any = null;
        
        if (identificador.includes('@')) {
            const { data: userCor, error: errCor } = await supabase
                .from('usuario_sg_ingreso')
                .select('id_ingreso, perfil_sg_ingreso(*)')
                .eq('correo_institucional', identificador)
                .single();
            
            if (errCor || !userCor) return res.status(404).json({ error: 'Estudiante no registrado.' });
            
            perfil = Array.isArray(userCor.perfil_sg_ingreso) 
                ? userCor.perfil_sg_ingreso[0] 
                : userCor.perfil_sg_ingreso;
        } else {
            const { data: perfCI, error: errCI } = await supabase
                .from('perfil_sg_ingreso')
                .select('*')
                .eq('ci', identificador)
                .single();
                
            if (errCI || !perfCI) return res.status(404).json({ error: 'Cédula de Identidad no encontrada.' });
            perfil = perfCI;
        }

        if (!perfil) return res.status(404).json({ error: 'No se pudo procesar el perfil del usuario.' });

        const { data: nuevaAsistencia, error: errorAsist } = await supabase
            .from('asistencia_sg_ingreso')
            .insert([{ id_perfil: perfil.id_perfil, estado_asistencia: 'Presente' }])
            .select();

        if (errorAsist) return res.status(400).json({ error: 'No se pudo registrar el ingreso.' });

        res.json({
            message: `Ingreso correcto registrado`,
            nombre: `${perfil.nombre} ${perfil.apellido}`,
            rol: perfil.rol,
            hora: new Date().toLocaleTimeString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al procesar la asistencia.' });
    }
});

// --- ENDPOINT 3: CRUD - CREAR NUEVO USUARIO (ADMIN) ---
app.post('/api/usuarios', async (req: Request, res: Response): Promise<any> => {
    const { correo, contrasenia, nombre, apellido, ci, rol } = req.body;
    try {
        const { data: usuario, error: errUser } = await supabase
            .from('usuario_sg_ingreso')
            .insert([{ correo_institucional: correo, contrasenia }])
            .select()
            .single();

        if (errUser) return res.status(400).json({ error: 'El correo ya existe o es inválido.' });

        const { data: perfil, error: errPerfil } = await supabase
            .from('perfil_sg_ingreso')
            .insert([{ id_ingreso: usuario.id_ingreso, nombre, apellido, ci, rol }])
            .select();

        if (errPerfil) return res.status(400).json({ error: 'Error al asignar los datos de perfil.' });

        res.status(201).json({ message: 'Usuario y Perfil creados con éxito.' });
    } catch (err) {
        res.status(500).json({ error: 'Error general en el registro.' });
    }
});

// --- ENDPOINT 4: CRUD - LISTAR TODOS LOS USUARIOS ---
app.get('/api/usuarios', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('perfil_sg_ingreso')
            .select('*, usuario_sg_ingreso(*)');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
});

// --- ENDPOINT 5: CRUD - ELIMINAR USUARIO ---
app.delete('/api/usuarios/:id_ingreso', async (req: Request, res: Response) => {
    try {
        const { id_ingreso } = req.params;
        const { error } = await supabase.from('usuario_sg_ingreso').delete().eq('id_ingreso', id_ingreso);
        if (error) throw error;
        res.json({ message: 'Usuario eliminado correctamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
});

// --- ENDPOINT 6: LISTAR HISTORIAL GENERAL DE ASISTENCIAS ---
app.get('/api/asistencias', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('asistencia_sg_ingreso')
            .select('*, perfil_sg_ingreso(*)')
            .order('id_asistencia', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el historial.' });
    }
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});