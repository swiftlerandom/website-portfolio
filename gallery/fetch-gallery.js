const API = 'https://api.github.com/repos/swiftlerandom/website-portfolio/contents/gallery';
const KEY = 'gallery-cache-v2';
const TTL = 300000;
const PREVIEW = 4;

const foldersData = {};

async function fetchCategories() {
    const nav = document.getElementById('category-nav');
    const root = document.getElementById('categories');
    const res = await fetch(API);
    if (!res.ok) throw new Error(res.status);
    const contents = await res.json(); 
    const dirs = contents.filter(f => f.type === 'dir');
    for (const dir of dirs) {
        const dirRes = await fetch(dir.url);
        if (!dirRes.ok) continue;
        const dirContents = await dirRes.json();
        const images = dirContents
            .filter(f => f.type === 'file' && /\.(jpe?g|png|webp)$/i.test(f.name))
            .map(f => ({ url: f.download_url, name: f.name }));
        if (images.length > 0) {
            foldersData[dir.name] = images;
        }
    }
    renderCategories(nav, root, foldersData);
}

function renderCategories(nav, root, data) {
    nav.innerHTML = '';
    root.innerHTML = '';
    let total = 0;

    Object.entries(data).forEach(([name, images]) => total += images.length);
    const allBtn = document.createElement('button');
    allBtn.dataset.target = 'all';
    allBtn.className = 'active';
    allBtn.innerHTML = `All<small>${total}</small>`;
    nav.appendChild(allBtn);

    Object.entries(data).forEach(([folderName, images], i) => {
        const id = 'cat-' + i;
        
        const pill = document.createElement('button');
        pill.dataset.target = id;
        pill.innerHTML = `${folderName}<small>${images.length}</small>`;
        nav.appendChild(pill);

        const section = document.createElement('section');
        section.className = 'category';
        section.id = id;
        
        let galleryHTML = '';
        images.forEach((img, n) => {
            const cleanName = img.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' ').replace(/ - Copy( \(\d+\))?/g, '');
            const isExtra = n >= PREVIEW;
            galleryHTML += `<div class="gallery-item" ${isExtra ? 'hidden data-extra' : ''}>
                <img src="${img.url}" alt="${cleanName}" loading="lazy">
                <div class="gallery-caption">${cleanName}</div>
            </div>`;
        });

        section.innerHTML = `
            <div class="category-head">
                <div class="category-icon">📁</div>
                <div><h3>${folderName}</h3><p>${images.length} images</p></div>
                ${images.length > PREVIEW ? `<button class="category-toggle" data-open="0">Show all</button>` : ''}
            </div>
            <div class="gallery">${galleryHTML}</div>
        `;
        root.appendChild(section);
    });

    setupInteractions(nav, root);
}

function setupInteractions(nav, root) {
    nav.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
        root.querySelectorAll('.category').forEach(c => {
            c.hidden = btn.dataset.target !== 'all' && c.id !== btn.dataset.target;
        });
        root.querySelectorAll('.category').forEach(c => {
            const single = btn.dataset.target !== 'all';
            const toggle = c.querySelector('.category-toggle');
            c.querySelectorAll('[data-extra]').forEach(x => x.hidden = !single);
            if (toggle) { toggle.hidden = single; toggle.dataset.open = '0'; toggle.textContent = 'Show all'; }
        });
    });

    root.addEventListener('click', e => {
        const toggle = e.target.closest('.category-toggle');
        if (toggle) {
            const open = toggle.dataset.open === '1';
            toggle.closest('.category').querySelectorAll('[data-extra]').forEach(x => x.hidden = open);
            toggle.dataset.open = open ? '0' : '1';
            toggle.textContent = open ? 'Show all' : 'Show less';
            return;
        }
        
        if (e.target.tagName === 'IMG') {
            document.getElementById('lightbox-img').src = e.target.src;
            document.getElementById('lightbox-img').alt = e.target.alt;
            document.getElementById('lightbox-caption').textContent = e.target.alt;
            document.getElementById('lightbox').classList.add('active');
        }
    });
}

const lightbox = document.getElementById('lightbox');
const close = () => lightbox.classList.remove('active');
lightbox.addEventListener('click', close);
document.addEventListener('keydown', e => e.key === 'Escape' && close());

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('categories');
    if (!container) return;

    fetchCategories().catch(err => {
        console.error(err);
        container.innerHTML = '<p style="color:#808080;padding:1rem">Gallery could not be loaded right now. Please refresh later.</p>';
    });
});