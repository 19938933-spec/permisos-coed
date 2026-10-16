// ==================== ELEMENTOS DEL DOM ====================
const form = document.getElementById('permisoForm');
const btnGenerar = document.getElementById('btnGenerar');
const btnExplicacion = document.getElementById('btnExplicacion');
const loaderOverlay = document.getElementById('loaderOverlay');
const previewSection = document.getElementById('previewSection');
const pdfPreview = document.getElementById('pdfPreview');
const btnDescargar = document.getElementById('btnDescargar');
const btnNuevo = document.getElementById('btnNuevo');
const telefonoInput = document.getElementById('telefono');
const motivoTextarea = document.getElementById('motivo');

// Variable global para el PDF generado
let pdfDoc = null;

// ==================== VALIDACIÓN TELÉFONO (solo 8 dígitos) ====================
telefonoInput.addEventListener('input', (e) => {
  // Solo permitir números
  e.target.value = e.target.value.replace(/\D/g, '');
  
  // Limitar a 8 dígitos
  if (e.target.value.length > 8) {
    e.target.value = e.target.value.slice(0, 8);
  }
});

// ==================== CREAR EXPLICACIÓN FORMAL (MEJORADA) ====================
btnExplicacion.addEventListener('click', () => {
  const motivoCorto = motivoTextarea.value.trim();
  const clasificacion = document.getElementById('clasificacionMotivo').value;
  const estudianteRaw = document.getElementById('nombreEstudiante').value.trim();
  const estudiante = estudianteRaw || 'el/la estudiante';

  if (!motivoCorto) {
    alert('Primero escribe una explicación breve del motivo.');
    motivoTextarea.focus();
    return;
  }

  // Capitalizar nombre del estudiante
  const nombreEstudiante = estudianteRaw
    ? estudianteRaw.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    : 'el/la estudiante';

  let formal = '';

  // Función auxiliar para limpiar y capitalizar la primera letra
  const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  // Limpiamos el texto del usuario (quitamos puntos finales y lo normalizamos)
  let motivoLimpio = motivoCorto.replace(/\.$/, '').trim();

  switch (clasificacion) {
    case 'Constancia médica':
      formal = `Por motivos de salud debidamente justificados, ${nombreEstudiante} no pudo presentarse a clases en la fecha indicada. ${capitalizar(motivoLimpio)}. Se adjunta la constancia médica correspondiente.`;
      break;

    case 'Cita médica':
      formal = `Debido a una cita médica previamente programada, ${nombreEstudiante} se le fue impeido de asistir a sus clases.`;
      break;

    case 'Situación familiar':
      formal = `Por una situación familiar de carácter urgente e imprevisto, ${nombreEstudiante} no pudo asistir a clases. Agradezco de antemano la comprensión.`;
      break;

    case 'Otro':
      formal = `Por el motivo urgente, ${nombreEstudiante} no asistió a clases. Se solicita muy respetuosamente se tome en cuenta la presente justificación.`;
      break;

    default:
      formal = `Por el siguiente motivo, ${nombreEstudiante} no asistió a clases.`;
  }

  // Evitar que quede el texto original pegado
  motivoTextarea.value = formal;
});
// ==================== GENERAR PERMISO ====================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validaciones
  const telefono = telefonoInput.value.trim();
  if (telefono.length !== 8) {
    alert('El teléfono debe tener exactamente 8 dígitos numéricos.');
    telefonoInput.focus();
    return;
  }

  // Mostrar loader
  loaderOverlay.classList.remove('hidden');
  document.querySelector('.main-container').style.display = 'none';

  // Pequeña pausa para que se vea el loader
  await new Promise(resolve => setTimeout(resolve, 1800));

  try {
    await generarPDF();
  } catch (error) {
    console.error(error);
    alert('Ocurrió un error al generar el PDF. Intenta de nuevo.');
    loaderOverlay.classList.add('hidden');
    document.querySelector('.main-container').style.display = 'flex';
  }
});

// ==================== FUNCIÓN PRINCIPAL: GENERAR PDF ====================
async function generarPDF() {
  const { jsPDF } = window.jspdf;

  // Datos del formulario
  const data = {
    encargado: document.getElementById('nombreEncargado').value.trim(),
    estudiante: document.getElementById('nombreEstudiante').value.trim(),
    grado: document.getElementById('gradoSeccion').value,
    dias: document.getElementById('diasInasistencia').value.trim(),
    clasificacion: document.getElementById('clasificacionMotivo').value,
    telefono: document.getElementById('telefono').value.trim(),
    motivo: document.getElementById('motivo').value.trim(),
    fecha: obtenerFechaActual()
  };

  // Crear el documento PDF (tamaño carta / A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 215.9 x 279.4 mm
  });

  // === LOGO ===
  // Cargamos el logo como imagen base64 o desde archivo
  const logoImg = document.getElementById('logoPreview');
  
  // Convertir logo a base64 para jsPDF
  const logoBase64 = await getBase64Image(logoImg);

  // Dibujar logo (izquierda superior)
  doc.addImage(logoBase64, 'PNG', 15, 12, 28, 28);

  // === ENCABEZADO ===
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('COMPLEJO EDUCATIVO THOMAS JEFFERSON', 105, 20, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text('"Somos lo que hacemos día a día, de modo que la excelencia no es un acto, sino un hábito"', 105, 27, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(20, 33, 195, 33);

  // Título del formato
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('FORMATO DE SOLICITUD DE PERMISOS POR INASISTENCIA', 105, 42, { align: 'center' });

  // === CUERPO DEL DOCUMENTO ===
  doc.setFont('times', 'normal');
  doc.setFontSize(11);

  let y = 55;

  // Fecha
  doc.text(`Fecha: ${data.fecha}`, 20, y);
  y += 12;

  // Presentación
  doc.text(`Por medio de la presente, yo, ${data.encargado},`, 20, y);
  y += 7;
  doc.text(`padre/madre o encargado(a) del estudiante: ${data.estudiante}`, 20, y);
  y += 10;

  // Grado / Sección
  doc.text(`Grado / Sección: ${data.grado}`, 20, y);
  y += 10;

  // Días
  doc.text(`Hago constar que el día(s): ${data.dias}`, 20, y);
  y += 10;

  // Motivo
  const motivoLines = doc.splitTextToSize(`El/La estudiante no asistió a clases debido a: ${data.motivo}`, 175);
  doc.text(motivoLines, 20, y);
  y += (motivoLines.length * 6) + 8;

  // Evidencia
  doc.text('Adjunto evidencia (si aplica):', 20, y);
  y += 8;

  // Checkboxes
  const checks = [
    { label: 'Constancia médica', value: 'Constancia médica' },
    { label: 'Cita médica', value: 'Cita médica' },
    { label: 'Situación familiar', value: 'Situación familiar' },
    { label: 'Otro', value: 'Otro' }
  ];

  let xPos = 25;
  checks.forEach((item, index) => {
    // Cuadro
    doc.rect(xPos, y - 3.5, 4, 4);
    
    // Marcar si corresponde
    if (data.clasificacion === item.value) {
      doc.setFont('times', 'bold');
      doc.text('X', xPos + 0.8, y);
      doc.setFont('times', 'normal');
    }

    doc.text(item.label, xPos + 6, y);
    xPos += 45;
  });

  // Si es "Otro", mostrar línea
  if (data.clasificacion === 'Otro') {
    y += 8;
    doc.text(`Otro: ${data.motivo.substring(0, 60)}...`, 25, y);
  }

  y += 14;

  // Solicitud
  const solicitud = 'Solicito muy respetuosamente se tome en cuenta la presente justificación y se le permita ponerse al día con las actividades académicas correspondientes.';
  const solLines = doc.splitTextToSize(solicitud, 175);
  doc.text(solLines, 20, y);
  y += (solLines.length * 6) + 12;

  // Firma del padre
  doc.text('Firma del padre/madre o encargado: _______________________________', 20, y);
  y += 10;

  doc.text(`Nombre completo: ${data.encargado}`, 20, y);
  doc.text(`Número de contacto: ${data.telefono}`, 120, y);
  y += 14;

  // Uso exclusivo de la institución
  doc.setFont('times', 'bold');
  doc.text('Uso exclusivo de la institución', 20, y);
  doc.setFont('times', 'normal');
  y += 9;

  // Checkboxes de aceptación
  doc.rect(25, y - 3.5, 4, 4);
  doc.text('Justificación aceptada', 32, y);

  doc.rect(85, y - 3.5, 4, 4);
  doc.text('Justificación rechazada', 92, y);

  doc.text('Observaciones: _______________________________', 145, y);
  y += 14;

  // Firma del docente
  doc.text('Nombre y Firma del docente: _______________________________', 20, y);
  doc.text('Fecha de revisión: ____ / ____ / ________', 130, y);

  // Guardar el documento
  pdfDoc = doc;

  // Generar vista previa (imagen)
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Convertir primera página a imagen para preview
  const canvas = await html2canvasFromPDF(doc);
  
  pdfPreview.innerHTML = '';
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.width = '100%';
  img.style.borderRadius = '6px';
  pdfPreview.appendChild(img);

  // Ocultar loader y mostrar preview
  loaderOverlay.classList.add('hidden');
  previewSection.classList.remove('hidden');
}

// ==================== HELPERS ====================
function obtenerFechaActual() {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  return `${dia} / ${mes} / ${anio}`;
}

function getBase64Image(img) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 200;
    canvas.height = img.naturalHeight || 200;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
}

// Crear una representación visual simple del PDF para la vista previa
async function html2canvasFromPDF(doc) {
  // Como alternativa más fiable, generamos un canvas blanco con el contenido
  // (jsPDF no tiene método nativo de preview fácil, así que usamos el output)
  const canvas = document.createElement('canvas');
  canvas.width = 794;  // approx letter width @ 96dpi
  canvas.height = 1123;
  const ctx = canvas.getContext('2d');
  
  // Fondo blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nota: para una preview perfecta se recomienda usar pdf.js, 
  // pero para mantenerlo simple y sin dependencias extra,
  // devolvemos el canvas y el usuario descarga el PDF real.
  // En la práctica el botón de descarga da el PDF exacto.

  // Como mejora rápida: mostramos un mensaje + el PDF se descarga limpio
  ctx.fillStyle = '#333';
  ctx.font = '16px Times New Roman';
  ctx.textAlign = 'center';
  ctx.fillText('Vista previa generada. Usa el botón "Descargar" para obtener el PDF oficial.', canvas.width / 2, 80);

  return canvas;
}

// ==================== BOTÓN DESCARGAR ====================
btnDescargar.addEventListener('click', () => {
  if (pdfDoc) {
    const estudiante = document.getElementById('nombreEstudiante').value.trim() || 'Estudiante';
    const nombreArchivo = `Permiso_${estudiante.replace(/\s+/g, '_')}.pdf`;
    pdfDoc.save(nombreArchivo);
  }
});

// ==================== CREAR OTRO PERMISO ====================
btnNuevo.addEventListener('click', () => {
  previewSection.classList.add('hidden');
  document.querySelector('.main-container').style.display = 'flex';
  form.reset();
  pdfDoc = null;
  pdfPreview.innerHTML = '';
});
