const API = 'https://api.github.com/repos/swiftlerandom/website-portfolio/contents/gallery';
const KEY = 'gallery-cache';
const TTL = 300000;

function render(el, urls) {
	el.replaceChildren(...urls.map(url => {
		const name = decodeURIComponent(url.split('/').pop());
		const item = document.createElement('div');
		item.className = 'gallery-item';
		item.innerHTML = '<img loading="lazy" decoding="async"><div class="gallery-caption"></div>';
		item.firstChild.src = url;
		item.firstChild.alt = name;
		item.lastChild.textContent = name;
		return item;
	}));
}

document.addEventListener('DOMContentLoaded', async () => {
	const el = document.querySelector('.gallery');
	if (!el) return;

	const lightbox = document.getElementById('lightbox');
	const lightboxImg = document.getElementById('lightbox-img');
	const close = () => lightbox.classList.remove('active');

	el.addEventListener('click', e => {
		if (e.target.tagName !== 'IMG') return;
		lightboxImg.src = e.target.src;
		lightboxImg.alt = e.target.alt;
		lightbox.classList.add('active');
	});
	lightbox.addEventListener('click', close);
	document.addEventListener('keydown', e => e.key === 'Escape' && close());

	let cache;
	try { cache = JSON.parse(localStorage.getItem(KEY)); } catch {}
	if (cache && Date.now() - cache.timestamp < TTL) return render(el, cache.data);

	try {
		const res = await fetch(API);
		if (!res.ok) throw new Error(res.status);
		const data = (await res.json())
			.filter(f => f.type === 'file' && /\.(jpe?g|png|webp)$/i.test(f.name))
			.map(f => f.download_url);
		try { localStorage.setItem(KEY, JSON.stringify({ timestamp: Date.now(), data })); } catch {}
		render(el, data);
	} catch {
		if (cache) render(el, cache.data);
		else el.innerHTML = '<p style="color:#808080;padding:1rem">Gallery could not be loaded right now. Please refresh later.</p>';
	}
});