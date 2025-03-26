// Guardar y cargar el folio
function loadFolio() {
    const storedFolio = localStorage.getItem('folio');
    return storedFolio ? parseInt(storedFolio, 10) : 1;
}

function saveFolio(folio) {
    localStorage.setItem('folio', folio);
}

// Procesar archivo de entrada
document.querySelector('#file-input').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileData = e.target.result;
        let data;
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'xlsx' || ext === 'xls') {
            data = XLSX.read(fileData, { type: 'binary' });
            const sheet = data.Sheets[data.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            populateTable(jsonData);
        }
        // Aquí puedes agregar más casos si soportas otros tipos de archivos
    };
    reader.readAsBinaryString(file);
}

// Población de la tabla con los datos
function populateTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = '';  // Limpiar solo el contenido del tbody
    let folio = loadFolio();

    const rows = data.slice(1);  // Eliminar la primera fila (encabezado)

    rows.forEach((row) => {
        const qrData = {
            code: row[0],
            description: row[1],
            date: formatDate(row[2]),  // Aquí aplicamos la función formatDate
            invoice: row[3],
            oc: row[4],
            register: row[5],
            provider: row[5],
            client: row[7],
            folio: folio++
        };

        const qrCodeCanvas = document.createElement('canvas');
        QRCode.toCanvas(qrCodeCanvas, JSON.stringify(qrData), (error) => {
            if (error) console.error(error);
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${formatDate(row[2])}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]}</td>
            <td>${row[6]}</td>
            <td>${row[7]}</td>
        `;

        const qrTd = document.createElement('td');
        qrTd.appendChild(qrCodeCanvas);
        tr.appendChild(qrTd);

        tableBody.appendChild(tr);
    });

    saveFolio(folio);
}

// Función para formatear la fecha en formato dd/mm/yyyy
function formatDate(date) {
    const parsedDate = new Date(Date.UTC(0, 0, date - 1));
    if (!isNaN(parsedDate.getTime())) {
        // Extraemos el día, mes y año
        const day = parsedDate.getUTCDate().toString().padStart(2, '0');
        const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = parsedDate.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }

    return date; // Si no es una fecha válida, retornamos tal cual
}

// Generar todos los QR cuando se hace clic en el botón
document.querySelector('#generate-all-qr-btn').addEventListener('click', generateAllQRs);

function generateAllQRs() {
    const rows = document.querySelectorAll('#data-table tbody tr');
    rows.forEach((row, index) => {
        const qrData = {
            code: row.children[0].innerText,
            description: row.children[1].innerText,
            date: row.children[2].innerText,
            invoice: row.children[3].innerText,
            oc: row.children[4].innerText,
            register: row.children[5].innerText,
            provider: row.children[6].innerText,
            client: row.children[7].innerText,
            folio: loadFolio() + index + 1
        };

        const qrCodeCanvas = row.querySelector('canvas');
        if (qrCodeCanvas) {
            QRCode.toCanvas(qrCodeCanvas, JSON.stringify(qrData), (error) => {
                if (error) console.error(error);
            });
        }
    });
}

// Exportar tabla a archivo XLS
document.querySelector('#export-btn').addEventListener('click', exportToXLS);

function exportToXLS() {
    const wb = XLSX.utils.table_to_book(document.querySelector('#data-table'), { sheet: 'Sheet1' });
    XLSX.writeFile(wb, 'table_dataQR.xlsx');
}

// Imprimir códigos QR
document.querySelector('#print-qr-btn').addEventListener('click', printQRs);

function printQRs() {
    const rows = document.querySelectorAll('#data-table tbody tr');
    const qrData = []; // Almacenará las imágenes base64 de los QR y sus identificadores

    // Recopilar los canvas generados para los QR y sus identificadores
    rows.forEach((row) => {
        const qrCodeCanvas = row.querySelector('canvas');
        const code = row.children[0].innerText; // Obtener el valor de la primera columna (código)
        const description = row.children[1].innerText; // Obtener la descripción
        const date = row.children[2].innerText;
        const provider = row.children[6].innerText;
        if (qrCodeCanvas) {
            // Convertir el canvas a una imagen base64
            const qrImage = qrCodeCanvas.toDataURL('image/png');
            qrData.push({ image: qrImage, code: code, description: description, date: date, provider: provider }); // Guardar la imagen y los datos
        }
    });

    // Verificamos si hay QR para imprimir
    if (qrData.length > 0) {
        // Creamos una ventana para la impresión
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write('<html><head><title>Impresión de Códigos QR</title>');
        printWindow.document.write(`
            <style>
                @media print {
                    @page {
                        margin: 0;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                    }
                    .page {
                        display: grid;
                        grid-template-columns: repeat(2, 10.1cm);
                        grid-template-rows: repeat(3, 8.4cm);
                        column-gap: 6mm;
                        row-gap: 0mm;
                        width: 21.6cm;
                        height: 27.9cm;
                        page-break-after: always;
                        padding: 15mm 3mm;
                        box-sizing: border-box;
                    }
                    .qr-container {
                        display: flex;
                        border: 1px solid #ccc;
                        padding: 2px;
                        margin: 0;
                        height: 8.4cm;
                        width: 10.1cm;
                        box-sizing: border-box;
                    }
                    .qr-left {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        width: 10cm;
                        height: 8cm;
                    }
                    .qr-right {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        padding-left: 3px;
                        width: 70%;
                        height: 100%;
                    }
                    img {
                        max-width: 87%;
                        max-height: auto;
                        border: none;
                    }
                    .data {
                        font-size: 15px;
                        text-align: left;
                        line-height: 1.2;
                    }
                }
            </style>
        `);
        printWindow.document.write('</head><body>');

        // Dividir los QR en páginas de 40 (4x10)
        const qrPerPage = 6; // 4 columnas × 10 filas
        for (let i = 0; i < qrData.length; i += qrPerPage) {
            const pageQrData = qrData.slice(i, i + qrPerPage); // QR para esta página

            // Crear una página con una cuadrícula de 4x10
            printWindow.document.write('<div class="page">');
            pageQrData.forEach((qr) => {
                printWindow.document.write(`
                    <div class="qr-container">
                        <div class="qr-left">
                            <img src="${qr.image}" alt="Código QR">
                        </div>
                        <br>
                        <div class="qr-right">
                            <div class="data" style="font-size 18px"><strong>Código: </strong>${qr.code}</div>
                            <div class="data" style="font-size 18px"><strong>Descripción: </strong>${qr.description}</div>
                            <div class="data" style="font-size 18px"><strong>Fecha: </strong>${qr.date}</div>
                            <div class="data" style="font-size 18px"><strong>Proveedor: </strong>${qr.provider}</div>
                        </div>
                    </div>
                `);
            });
            printWindow.document.write('</div>'); // Cerrar la página
        }

        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Esperamos que el contenido se cargue antes de imprimir
        printWindow.onload = function () {
            printWindow.print();
            printWindow.close();
        };
    } else {
        alert('No se encontraron códigos QR para imprimir.');
    }
}