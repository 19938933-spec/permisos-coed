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
const fechaInput = document.getElementById('diasInasistencia');

// Variable global para el PDF generado
let pdfDoc = null;

// ==================== VALIDACIÓN TELÉFONO (solo 8 dígitos) ====================
telefonoInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '');
  if (e.target.value.length > 8) {
    e.target.value = e.target.value.slice(0, 8);
  }
});

// ==================== CALENDARIO - BLOQUEAR SÁBADOS Y DOMINGOS ====================
fechaInput.addEventListener('change', (e) => {
  if (!e.target.value) return;

  const fechaSeleccionada = new Date(e.target.value + 'T00:00:00');
  const diaSemana = fechaSeleccionada.getDay(); // 0 = Domingo, 6 = Sábado

  if (diaSemana === 0 || diaSemana === 6) {
    alert('No se pueden seleccionar sábados ni domingos.\nSolo se permiten días de lunes a viernes.');
    e.target.value = '';
    e.target.focus();
  }
});

fechaInput.addEventListener('input', (e) => {
  if (e.target.value) {
    const fecha = new Date(e.target.value + 'T00:00:00');
    const dia = fecha.getDay();
    if (dia === 0 || dia === 6) {
      e.target.value = '';
    }
  }
});

// ==================== CREAR EXPLICACIÓN FORMAL ====================
btnExplicacion.addEventListener('click', () => {
  const motivoCorto = motivoTextarea.value.trim();
  const clasificacion = document.getElementById('clasificacionMotivo').value;
  const estudianteRaw = document.getElementById('nombreEstudiante').value.trim();

  if (!motivoCorto) {
    alert('Primero escribe una explicación breve del motivo.');
    motivoTextarea.focus();
    return;
  }

  const nombreEstudiante = estudianteRaw
    ? estudianteRaw.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    : 'el/la estudiante';

  const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).trim();
  };

  let motivoLimpio = motivoCorto.replace(/\.$/, '').trim();
  let formal = '';

  switch (clasificacion) {
    case 'Constancia médica':
      formal = `Por motivos de salud debidamente justificados, ${nombreEstudiante} no pudo presentarse a clases en la fecha indicada. ${capitalizar(motivoLimpio)}. Se adjunta la constancia médica correspondiente.`;
      break;

    case 'Cita médica':
      formal = `Debido a una cita médica previamente programada, ${nombreEstudiante} no pudo asistir a sus clases. ${capitalizar(motivoLimpio)}.`;
      break;

    case 'Situación familiar':
      formal = `Por una situación familiar de carácter urgente e imprevisto, ${nombreEstudiante} no pudo asistir a clases. ${capitalizar(motivoLimpio)}. Agradezco de antemano la comprensión.`;
      break;

    case 'Otro':
      formal = `Por el siguiente motivo, ${nombreEstudiante} no asistió a clases: ${capitalizar(motivoLimpio)}. Se solicita muy respetuosamente se tome en cuenta la presente justificación.`;
      break;

    default:
      formal = `Por el siguiente motivo, ${nombreEstudiante} no asistió a clases: ${capitalizar(motivoLimpio)}.`;
  }

  motivoTextarea.value = formal;
});

// ==================== GENERAR PERMISO ====================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const telefono = telefonoInput.value.trim();
  if (telefono.length !== 8) {
    alert('El teléfono debe tener exactamente 8 dígitos numéricos.');
    telefonoInput.focus();
    return;
  }

  if (!fechaInput.value) {
    alert('Debes seleccionar una fecha de inasistencia.');
    fechaInput.focus();
    return;
  }

  // Mostrar loader
  loaderOverlay.classList.remove('hidden');
  document.querySelector('.main-container').style.display = 'none';

  await new Promise(resolve => setTimeout(resolve, 1600));

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

  const data = {
    encargado: document.getElementById('nombreEncargado').value.trim(),
    estudiante: document.getElementById('nombreEstudiante').value.trim(),
    grado: document.getElementById('gradoSeccion').value,
    dias: formatearFecha(document.getElementById('diasInasistencia').value),
    clasificacion: document.getElementById('clasificacionMotivo').value,
    telefono: document.getElementById('telefono').value.trim(),
    motivo: document.getElementById('motivo').value.trim(),
    fecha: obtenerFechaActual()
  };

  // Capitalizar nombres
  const capitalizarNombre = (nombre) => {
    return nombre.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };
  data.encargado = capitalizarNombre(data.encargado);
  data.estudiante = capitalizarNombre(data.estudiante);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // === LOGO ===
  const logoImg = document.getElementById('logoPreview');
  const logoBase64 = await getBase64Image(logoImg);
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 15, 10, 26, 26);
  }

  // === ENCABEZADO ===
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('COMPLEJO EDUCATIVO THOMAS JEFFERSON', 105, 18, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.text('"Somos lo que hacemos día a día, de modo que la excelencia no es un acto, sino un hábito"', 105, 24, { align: 'center' });

  // Línea
  doc.setDrawColor(30, 60, 120);
  doc.setLineWidth(0.5);
  doc.line(18, 30, 197, 30);

  // Título
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(0);
  doc.text('FORMATO DE SOLICITUD DE PERMISOS POR INASISTENCIA', 105, 38, { align: 'center' });

  // === CUERPO ===
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);

  let y = 50;

  // Fecha
  doc.text(`Fecha: ${data.fecha}`, 20, y);
  y += 11;

  // Presentación
  doc.text(`Por medio de la presente, yo, ${data.encargado},`, 20, y);
  y += 6.5;
  doc.text(`padre/madre o encargado(a) del estudiante: ${data.estudiante}`, 20, y);
  y += 9;

  // Grado
  doc.text(`Grado / Sección: ${data.grado}`, 20, y);
  y += 9;

  // Días
  doc.text(`Hago constar que el día(s): ${data.dias}`, 20, y);
  y += 9;

  // Motivo
  const motivoTexto = `El/La estudiante no asistió a clases debido a: ${data.motivo}`;
  const motivoLines = doc.splitTextToSize(motivoTexto, 175);
  doc.text(motivoLines, 20, y);
  y += (motivoLines.length * 5.5) + 8;

  // Evidencia
  doc.setFont('times', 'bold');
  doc.text('Adjunto evidencia (si aplica):', 20, y);
  doc.setFont('times', 'normal');
  y += 7;

  // Checkboxes
  const checks = [
    { label: 'Constancia médica', value: 'Constancia médica' },
    { label: 'Cita médica', value: 'Cita médica' },
    { label: 'Situación familiar', value: 'Situación familiar' },
    { label: 'Otro', value: 'Otro' }
  ];

  let xPos = 22;
  checks.forEach((item) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(xPos, y - 3.2, 3.8, 3.8);

    if (data.clasificacion === item.value) {
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('X', xPos + 0.7, y + 0.3);
      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
    }

    doc.text(item.label, xPos + 5.5, y);
    xPos += 44;
  });

  y += 12;

  // Solicitud
  const solicitud = 'Solicito muy respetuosamente se tome en cuenta la presente justificación y se le permita ponerse al día con las actividades académicas correspondientes.';
  const solLines = doc.splitTextToSize(solicitud, 175);
  doc.text(solLines, 20, y);
  y += (solLines.length * 5.5) + 11;

  // Firma del padre
  doc.text('Firma del padre/madre o encargado: ________________________________', 20, y);
  y += 9;

  doc.text(`Nombre completo: ${data.encargado}`, 20, y);
  doc.text(`Número de contacto: ${data.telefono}`, 115, y);
  y += 14;

  // ======================================================
  //  CUADRO "USO EXCLUSIVO DE LA INSTITUCIÓN"
  // ======================================================
  const boxX = 18;
  const boxY = y;
  const boxWidth = 179;
  const boxHeight = 38;

  doc.setDrawColor(30, 60, 120);
  doc.setLineWidth(0.6);
  doc.rect(boxX, boxY, boxWidth, boxHeight);

  // Título del cuadro
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('Uso exclusivo de la institución', boxX + 4, boxY + 6);

  // Línea debajo del título
  doc.setLineWidth(0.3);
  doc.line(boxX + 3, boxY + 8, boxX + boxWidth - 3, boxY + 8);

  doc.setFont('times', 'normal');
  doc.setFontSize(10);

  // Checkboxes
  doc.rect(boxX + 6, boxY + 14, 3.8, 3.8);
  doc.text('Justificación aceptada', boxX + 12, boxY + 17);

  doc.rect(boxX + 70, boxY + 14, 3.8, 3.8);
  doc.text('Justificación rechazada', boxX + 76, boxY + 17);

  // Observaciones
  doc.text('Observaciones: _______________________________________________', boxX + 6, boxY + 27);

  // Firma docente + fecha
  doc.text('Nombre y Firma del docente: _______________________________', boxX + 6, boxY + 35);
  doc.text('Fecha de revisión: ____ / ____ / ________', boxX + 115, boxY + 35);

  // ======================================================

  // Guardar documento
  pdfDoc = doc;

  // === VISTA PREVIA REAL (iframe) ===
  const pdfDataUri = doc.output('datauristring');

  pdfPreview.innerHTML = `
    <iframe 
      src="${pdfDataUri}" 
      width="100%" 
      height="720px" 
      style="border: none; border-radius: 8px; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
    </iframe>
  `;

  // Mostrar preview
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

function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  
  const fecha = new Date(fechaISO + 'T00:00:00');
  const opciones = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  // Ejemplo: "miércoles, 15 de octubre de 2026"
  let fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);
  // Capitalizar la primera letra
  return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
}

function getBase64Image(img) {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    } else {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      setTimeout(() => resolve(''), 1500);
    }
  });
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
