document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE SUPABASE ---
    // Asegúrate de reemplazar esto con tus propias claves de Supabase.
    // Es crucial que estas sean las mismas que en auth.js
    const supabaseUrl = 'URL_DE_TU_PROYECTO_SUPABASE';
    const supabaseKey = 'TU_SUPABASE_ANON_KEY';
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('URL') || supabaseKey.includes('KEY')) {
        console.error("Error: Las credenciales de Supabase no están configuradas en script.js.");
        // Ocultar el formulario principal si no hay configuración
        document.getElementById('app-container').innerHTML = '<h2 style="text-align:center; color:red; margin-top: 50px;">Error de configuración de la aplicación.</h2>';
        return;
    }

    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // --- ELEMENTOS DEL DOM ---
    const placaInput = document.getElementById('placa');
    const marcaInput = document.getElementById('marca');
    const colorInput = document.getElementById('color');
    const carroceriaInput = document.getElementById('carroceria');
    const guardarBtn = document.getElementById('guardar-btn');

    // --- FUNCIÓN DE AUTOCOMPLETADO GENÉRICA ---
    /**
     * Crea una funcionalidad de autocompletado en un campo de texto.
     * @param {HTMLInputElement} inputEl - El elemento input.
     * @param {string} tableName - El nombre de la tabla en Supabase.
     * @param {string} columnName - El nombre de la columna a buscar.
     */
    function setupAutocomplete(inputEl, tableName, columnName) {
        let currentFocus;
        inputEl.addEventListener('input', async function(e) {
            const value = this.value;
            closeAllLists();
            if (!value) return false;
            currentFocus = -1;

            // Crear el contenedor de la lista de sugerencias
            const autocompleteList = document.createElement('DIV');
            autocompleteList.setAttribute('id', this.id + 'autocomplete-list');
            autocompleteList.setAttribute('class', 'autocomplete-items');
            this.parentNode.appendChild(autocompleteList);

            // Consultar a Supabase
            const { data, error } = await supabase
                .from(tableName)
                .select(columnName)
                .ilike(columnName, `%${value}%`) // ilike para búsqueda insensible a mayúsculas
                .limit(10);

            if (error) {
                console.error('Error en autocompletado:', error);
                return;
            }

            // Mostrar sugerencias
            data.forEach(item => {
                const suggestionDiv = document.createElement('DIV');
                suggestionDiv.innerHTML = `<strong>${item[columnName].substr(0, value.length)}</strong>`;
                suggestionDiv.innerHTML += item[columnName].substr(value.length);
                suggestionDiv.innerHTML += `<input type='hidden' value='${item[columnName]}'>`;
                
                suggestionDiv.addEventListener('click', function(e) {
                    inputEl.value = this.getElementsByTagName('input')[0].value;
                    closeAllLists();
                });
                autocompleteList.appendChild(suggestionDiv);
            });
        });
        
        // Manejo con teclado (flechas y Enter)
        inputEl.addEventListener('keydown', function(e) {
            let x = document.getElementById(this.id + 'autocomplete-list');
            if (x) x = x.getElementsByTagName('div');
            if (e.keyCode == 40) { // Flecha abajo
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) { // Flecha arriba
                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) { // Enter
                e.preventDefault();
                if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                }
            }
        });

        function addActive(x) {
            if (!x) return false;
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            x[currentFocus].classList.add('autocomplete-active');
        }

        function removeActive(x) {
            for (let i = 0; i < x.length; i++) {
                x[i].classList.remove('autocomplete-active');
            }
        }

        function closeAllLists(elmnt) {
            const items = document.getElementsByClassName('autocomplete-items');
            for (let i = 0; i < items.length; i++) {
                if (elmnt != items[i] && elmnt != inputEl) {
                    items[i].parentNode.removeChild(items[i]);
                }
            }
        }
        
        document.addEventListener('click', function (e) {
            closeAllLists(e.target);
        });
    }

    // --- INICIALIZAR AUTOCOMPLETADOS ---
    // Asumiendo que tienes tablas llamadas 'marcas', 'colores' y 'carrocerias'
    // con columnas 'nombre_marca', 'nombre_color', 'tipo_carroceria' respectivamente.
    // **Debes ajustar los nombres de las tablas y columnas a tu esquema de Supabase.**
    setupAutocomplete(marcaInput, 'marcas', 'nombre_marca');
    setupAutocomplete(colorInput, 'colores', 'nombre_color');
    setupAutocomplete(carroceriaInput, 'carrocerias', 'tipo_carroceria');
    
    // Autocompletado para 'placa' que trae datos de un vehículo existente.
    placaInput.addEventListener('change', async () => {
        const placa = placaInput.value.toUpperCase();
        if(placa.length < 6) return;

        // Asume que tienes una tabla 'vehiculos' con los datos.
        const { data, error } = await supabase
            .from('vehiculos')
            .select('*')
            .eq('placa', placa)
            .single(); // .single() para obtener un solo registro

        if(data) {
            // Rellena los campos del formulario con los datos encontrados
            document.getElementById('marca').value = data.marca || '';
            document.getElementById('color').value = data.color || '';
            document.getElementById('clase-vehiculo').value = data.clase_vehiculo || '';
            document.getElementById('tipo-servicio').value = data.tipo_servicio || '';
            document.getElementById('tipo-combustible').value = data.tipo_combustible || '';
            // ... y así con todos los demás campos que quieras autocompletar.
        }
    });

    // --- GUARDAR DATOS EN SUPABASE ---
    guardarBtn.addEventListener('click', async () => {
        // Recolectar todos los datos del formulario
        const registro = {
            placa: document.getElementById('placa').value.toUpperCase(),
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            marca: document.getElementById('marca').value,
            color: document.getElementById('color').value,
            clase_vehiculo: document.getElementById('clase-vehiculo').value,
            tipo_servicio: document.getElementById('tipo-servicio').value,
            // ... recolecta todos los demás campos del formulario aquí
        };

        // Validar campos obligatorios
        if (!registro.placa || !registro.fecha || !registro.hora) {
            alert('Por favor, completa los campos obligatorios: Placa, Fecha y Hora.');
            return;
        }

        // Insertar en la tabla 'recepciones' (o como se llame tu tabla principal)
        const { data, error } = await supabase
            .from('recepciones')
            .insert([registro]);

        if (error) {
            console.error('Error al guardar:', error);
            alert(`Hubo un error al guardar los datos: ${error.message}`);
        } else {
            console.log('Datos guardados:', data);
            alert('¡Registro guardado con éxito!');
            document.getElementById('limpiar-btn').click(); // Limpiar formulario
        }
    });
    
    // --- LÓGICA ADICIONAL (fecha/hora, limpiar, etc.) ---
    // Establecer fecha y hora actuales por defecto
    const now = new Date();
    document.getElementById('fecha').value = now.toISOString().split('T')[0];
    document.getElementById('hora').value = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // Botón de limpiar
    document.getElementById('limpiar-btn').addEventListener('click', () => {
        document.querySelector('form').reset(); // Si tuvieras un <form>
        // O manualmente
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if(input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        // Restablecer fecha y hora
        document.getElementById('fecha').value = now.toISOString().split('T')[0];
        document.getElementById('hora').value = now.toTimeString().split(' ')[0].substring(0, 5);
    });
});
