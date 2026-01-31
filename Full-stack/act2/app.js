// Clase para cada tarea
class Tarea {
    constructor(texto) {
        this.id = Date.now();
        this.texto = texto;
        this.completada = false;
    }
    
    cambiarEstado() {
        this.completada = !this.completada;
    }
    
    editar(nuevoTexto) {
        this.texto = nuevoTexto;
    }
}

// Clase para manejar todas las tareas
class GestorTareas {
    constructor() {
        this.tareas = [];
        this.cargarTareas();
    }
    
    agregar(texto) {
        if (!texto.trim()) return false;
        
        const tarea = new Tarea(texto);
        this.tareas.push(tarea);
        this.guardar();
        return tarea;
    }
    
    eliminar(id) {
        const index = this.tareas.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tareas.splice(index, 1);
            this.guardar();
            return true;
        }
        return false;
    }
    
    editar(id, nuevoTexto) {
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea && nuevoTexto.trim()) {
            tarea.editar(nuevoTexto);
            this.guardar();
            return true;
        }
        return false;
    }
    
    completar(id) {
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea) {
            tarea.cambiarEstado();
            this.guardar();
            return true;
        }
        return false;
    }
    
    guardar() {
        localStorage.setItem('tareas', JSON.stringify(this.tareas));
    }
    
    cargarTareas() {
        const guardadas = localStorage.getItem('tareas');
        if (guardadas) {
            this.tareas = JSON.parse(guardadas);
        }
    }
    
    obtenerTodas() {
        return this.tareas;
    }
    
    contar() {
        return this.tareas.length;
    }
}

// Instancia global del gestor
const gestor = new GestorTareas();

// Mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const mensaje = document.getElementById('message');
    mensaje.textContent = texto;
    mensaje.className = tipo;
    mensaje.style.display = 'block';
    
    setTimeout(() => {
        mensaje.style.display = 'none';
    }, 3000);
}

// Crear elemento HTML de tarea
function crearElementoTarea(tarea) {
    const li = document.createElement('li');
    li.className = `task-item ${tarea.completada ? 'completed' : ''}`;
    li.dataset.id = tarea.id;
    
    li.innerHTML = `
        <div class="task-content">
            <input type="checkbox" ${tarea.completada ? 'checked' : ''}>
            <span class="task-text ${tarea.completada ? 'completed' : ''}">${tarea.texto}</span>
        </div>
        <div class="task-buttons">
            <button class="edit-btn">Editar</button>
            <button class="delete-btn">Eliminar</button>
        </div>
    `;
    
    // Evento para marcar como completada
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
        gestor.completar(tarea.id);
        li.classList.toggle('completed');
        li.querySelector('.task-text').classList.toggle('completed');
        actualizarContador();
    });
    
    // Evento para editar
    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
        const nuevoTexto = prompt('Editar tarea:', tarea.texto);
        if (nuevoTexto !== null && gestor.editar(tarea.id, nuevoTexto)) {
            li.querySelector('.task-text').textContent = nuevoTexto;
            mostrarMensaje('Tarea editada', 'success');
        }
    });
    
    // Evento para eliminar
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        if (confirm('¿Eliminar esta tarea?')) {
            if (gestor.eliminar(tarea.id)) {
                li.remove();
                actualizarContador();
                mostrarMensaje('Tarea eliminada', 'success');
            }
        }
    });
    
    return li;
}

// Actualizar la lista en pantalla
function actualizarLista() {
    const lista = document.getElementById('taskList');
    lista.innerHTML = '';
    
    gestor.obtenerTodas().forEach(tarea => {
        lista.appendChild(crearElementoTarea(tarea));
    });
    
    actualizarContador();
}

// Actualizar contador
function actualizarContador() {
    document.getElementById('counter').textContent = 
        `Tareas totales: ${gestor.contar()}`;
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Cargar tareas existentes
    actualizarLista();
    
    // Elementos del DOM
    const input = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    
    // Función para agregar tarea
    function agregarTarea() {
        const texto = input.value.trim();
        
        if (!texto) {
            mostrarMensaje('Escribe una tarea primero', 'error');
            return;
        }
        
        const tarea = gestor.agregar(texto);
        if (tarea) {
            const elemento = crearElementoTarea(tarea);
            document.getElementById('taskList').appendChild(elemento);
            input.value = '';
            input.focus();
            actualizarContador();
            mostrarMensaje('Tarea agregada', 'success');
        }
    }
    
    // Eventos
    addBtn.addEventListener('click', agregarTarea);
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            agregarTarea();
        }
    });
});