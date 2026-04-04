import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.1.392/build/pdf.min.mjs';

// Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.1.392/build/pdf.worker.min.mjs';

let pdfDoc = null;
let scale = 1.0;
const renderArea = document.getElementById('pdf-render-area');
const loadingSpinner = document.getElementById('loading-spinner');
const statusMessage = document.getElementById('status-message');
const fileNameDisplay = document.getElementById('file-name');
const pageCountSpan = document.getElementById('page-count');
const currentPageInput = document.getElementById('current-page');
const zoomLevelText = document.getElementById('zoom-level');
const viewerContainer = document.getElementById('viewer-container');

/**
 * Render a single page into a canvas.
 */
async function renderPage(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    // Create container for the page
    const pageContainer = document.createElement('div');
    pageContainer.className = 'canvas-wrapper';
    pageContainer.id = `page-${pageNum}`;
    pageContainer.dataset.pageNumber = pageNum;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    pageContainer.appendChild(canvas);
    renderArea.appendChild(pageContainer);

    // Render PDF page into canvas context
    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
}

/**
 * Render all pages for scrolling effect.
 */
async function renderAllPages() {
    renderArea.innerHTML = ''; // Clear previous renders
    loadingSpinner.classList.remove('hidden');
    statusMessage.textContent = `Rendering ${pdfDoc.numPages} pages...`;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        await renderPage(i);
    }

    loadingSpinner.classList.add('hidden');
    statusMessage.textContent = 'Ready';
    setupIntersectionObserver();
}

/**
 * Update current page number based on scroll position.
 */
function setupIntersectionObserver() {
    const options = {
        root: viewerContainer,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = entry.target.dataset.pageNumber;
                currentPageInput.value = pageNum;
            }
        });
    }, options);

    document.querySelectorAll('.canvas-wrapper[data-page-number]').forEach(page => {
        observer.observe(page);
    });
}

/**
 * Load the PDF document.
 */
async function loadPDF(url, fileName = "Document.pdf") {
    loadingSpinner.classList.remove('hidden');
    statusMessage.textContent = 'Fetching...';
    fileNameDisplay.textContent = fileName;

    try {
        pdfDoc = await pdfjsLib.getDocument(url).promise;
        pageCountSpan.textContent = pdfDoc.numPages;
        await renderAllPages();
    } catch (error) {
        console.error('Error loading PDF:', error);
        statusMessage.textContent = 'Error loading document';
        loadingSpinner.classList.add('hidden');
    }
}

// Event Listeners
document.getElementById('prev-page').addEventListener('click', () => {
    const currentNum = parseInt(currentPageInput.value);
    if (currentNum > 1) {
        const target = document.getElementById(`page-${currentNum - 1}`);
        target.scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    const currentNum = parseInt(currentPageInput.value);
    if (currentNum < pdfDoc.numPages) {
        const target = document.getElementById(`page-${currentNum + 1}`);
        target.scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('zoom-in').addEventListener('click', () => {
    scale += 0.25;
    zoomLevelText.textContent = `${Math.round(scale * 100)}%`;
    renderAllPages();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    if (scale <= 0.5) return;
    scale -= 0.25;
    zoomLevelText.textContent = `${Math.round(scale * 100)}%`;
    renderAllPages();
});

currentPageInput.addEventListener('change', (e) => {
    const num = parseInt(e.target.value);
    if (num > 0 && num <= pdfDoc.numPages) {
        const target = document.getElementById(`page-${num}`);
        target.scrollIntoView({ behavior: 'smooth' });
    } else {
        e.target.value = currentPageInput.value;
    }
});

// Initial Load (Read-Only Mode)
loadPDF('PDP Template.pdf', 'PDP Template.pdf');
