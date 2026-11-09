const MANIFEST = 'gallery/manifest.json';
const PREVIEW = 4;
const BATCH = 12;

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
        items.forEach(item => {
            const isVideo = item.type === 'video';
            const label = isVideo ? item.name : item.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').replace(/ - Copy( \(\d+\))?/g, '');
            const src = isVideo ? `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg` : item.thumb;
            galleryHTML += `<div class="gallery-item" hidden>
                <img data-src="${src}" ${isVideo ? `data-video="${item.id}"` : `data-full="${item.src}"`} alt="${label}" loading="lazy" decoding="async">
                ${isVideo ? '<span class="play">▶</span>' : ''}
                <div class="gallery-caption">${label}</div>
            </div>`;
        });

        section.innerHTML = `
            <div class="category-head">
                <div class="category-icon">📁</div>
                <div><h3>${folderName}</h3><p>${items.length} items</p></div>
                <button class="category-toggle" data-view="${id}" hidden>View all</button>
            </div>
            <div class="gallery">${galleryHTML}</div>
            <button class="category-toggle category-more" hidden>Load more</button>
        `;
        root.appendChild(section);
    });

    setupInteractions(nav, root);
    select(nav, root, 'all');
}

function setShown(sec, n, single) {
    const items = sec.querySelectorAll('.gallery-item');
    items.forEach((el, i) => {
        el.hidden = i >= n;
        const img = el.firstElementChild;
        if (i < n && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    });
    sec.dataset.shown = n;
    sec.querySelector('[data-view]').hidden = single || items.length <= PREVIEW;
    const more = sec.querySelector('.category-more');
    more.hidden = !single || n >= items.length;
    more.textContent = `Load more (${items.length - n})`;
}

function select(nav, root, target) {
    const single = target !== 'all';
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.target === target));
    root.querySelectorAll('.category').forEach(sec => {
        sec.hidden = single && sec.id !== target;
        if (!sec.hidden) setShown(sec, single ? BATCH : PREVIEW, single);
    });
}

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxCaption = document.getElementById('lightbox-caption');
let current = '';

function setupInteractions(nav, root) {
    nav.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (btn) select(nav, root, btn.dataset.target);
    });

    root.addEventListener('click', e => {
        const view = e.target.closest('[data-view]');
        if (view) return nav.querySelector(`[data-target="${view.dataset.view}"]`).click();

        const more = e.target.closest('.category-more');
        if (more) {
            const sec = more.closest('.category');
            return setShown(sec, +sec.dataset.shown + BATCH, true);
        }

        if (e.target.tagName === 'IMG') {
            const id = e.target.dataset.video;
            lightbox.classList.toggle('video', !!id);
            if (id) {
                lightboxVideo.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
            } else {
                const full = e.target.dataset.full;
                current = full;
                lightboxImg.src = e.target.src;
                const big = new Image();
                big.onload = () => current === full && (lightboxImg.src = full);
                big.src = full;
            }
            lightboxImg.alt = e.target.alt;
            lightboxCaption.textContent = e.target.alt;
            lightbox.classList.add('active');
        }
    });
}

const close = () => {
    current = '';
    lightbox.classList.remove('active', 'video');
    lightboxVideo.src = 'about:blank';
};
lightbox.addEventListener('click', close);
document.addEventListener('keydown', e => e.key === 'Escape' && close());

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('categories');
    if (!container) return;

    try {
        const res = await fetch(MANIFEST);
        if (!res.ok) throw new Error(res.status);
        renderCategories(document.getElementById('category-nav'), container, await res.json());
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:#808080;padding:1rem">Gallery could not be loaded right now. Please refresh later.</p>';
    }
});