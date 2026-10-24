const API = 'https://api.github.com/repos/swiftlerandom/website-portfolio/contents/gallery';
const KEY = 'gallery-cache-v2';
const TTL = 300000;
const PREVIEW = 4;

const foldersData = {};

function parseVideos(text) {
    return text.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
        .map(l => {
            const [link, title] = l.split('|').map(s => s.trim());
            const id = (link.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
            return id && { type: 'video', id, name: title || 'Video' };
        })
        .filter(Boolean);
}

async function fetchCategories() {
    const nav = document.getElementById('category-nav');
    const root = document.getElementById('categories');
    const res = await fetch(API);
    if (!res.ok) throw new Error(res.status);
    const dirs = (await res.json()).filter(f => f.type === 'dir');

    const results = await Promise.all(dirs.map(async dir => {
        const dirRes = await fetch(dir.url);
        if (!dirRes.ok) return null;
        const files = await dirRes.json();
        const images = files
            .filter(f => f.type === 'file' && /\.(jpe?g|png|webp)$/i.test(f.name))
            .map(f => ({ type: 'image', url: f.download_url, name: f.name }));
        const list = files.find(f => f.type === 'file' && /^videos\.txt$/i.test(f.name));
        const videos = list ? parseVideos(await (await fetch(list.download_url)).text()) : [];
        return [dir.name, [...videos, ...images]];
    }));

    results.forEach(r => r && r[1].length && (foldersData[r[0]] = r[1]));
    renderCategories(nav, root, foldersData);
}

function renderCategories(nav, root, data) {
    nav.innerHTML = '';
    root.innerHTML = '';
    let total = 0;

    Object.values(data).forEach(items => total += items.length);
    const allBtn = document.createElement('button');
    allBtn.dataset.target = 'all';
    allBtn.className = 'active';
    allBtn.innerHTML = `All<small>${total}</small>`;
    nav.appendChild(allBtn);

    Object.entries(data).forEach(([folderName, items], i) => {
        const id = 'cat-' + i;

        const pill = document.createElement('button');
        pill.dataset.target = id;
        pill.innerHTML = `${folderName}<small>${items.length}</small>`;
        nav.appendChild(pill);

        const section = document.createElement('section');
        section.className = 'category';
        section.id = id;

        let galleryHTML = '';
        items.forEach((item, n) => {
            const isVideo = item.type === 'video';
            const label = isVideo ? item.name : item.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').replace(/ - Copy( \(\d+\))?/g, '');
            const src = isVideo ? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg` : item.url;
            galleryHTML += `<div class="gallery-item" ${n >= PREVIEW ? 'hidden data-extra' : ''}>
                <img src="${src}" ${isVideo ? `data-video="${item.id}"` : ''} alt="${label}" loading="lazy">
                ${isVideo ? '<span class="play">▶</span>' : ''}
                <div class="gallery-caption">${label}</div>
            </div>`;
        });

        section.innerHTML = `
            <div class="category-head">
                <div class="category-icon">📁</div>
                <div><h3>${folderName}</h3><p>${items.length} items</p></div>
                ${items.length > PREVIEW ? `<button class="category-toggle" data-open="0">Show all</button>` : ''}
            </div>
            <div class="gallery">${galleryHTML}</div>
        `;
        root.appendChild(section);
    });

    setupInteractions(nav, root);
}

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxCaption = document.getElementById('lightbox-caption');

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
            const id = e.target.dataset.video;
            lightbox.classList.toggle('video', !!id);
            if (id) lightboxVideo.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
            else lightboxImg.src = e.target.src;
            lightboxImg.alt = e.target.alt;
            lightboxCaption.textContent = e.target.alt;
            lightbox.classList.add('active');
        }
    });
}

const close = () => {
    lightbox.classList.remove('active', 'video');
    lightboxVideo.src = 'about:blank';
};
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