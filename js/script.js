   // Función para extraer imagen del contenido HTML
        function extractImageFromContent(content) {
            const imgRegex = /<img[^>]+src="([^">]+)"/i;
            const match = content.match(imgRegex);
            
            if (match && match[1]) {
                let imgUrl = match[1];
                
                // Si es una imagen de Blogger, usar una versión de mejor calidad
                if (imgUrl.includes('googleusercontent.com') || imgUrl.includes('blogspot.com')) {
                    imgUrl = imgUrl.replace(/=s\d+-c/, '=s400-c');
                    imgUrl = imgUrl.replace(/=w\d+-h\d+/, '=w400-h200');
                }
                
                return imgUrl;
            }
            
            return null;
        }
        
        function createBlogCard(entry, index) {
            const title = entry.title.$t;
            const link = entry.link.find(l => l.rel === 'alternate').href;
            const published = new Date(entry.published.$t).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Extraer resumen limpio
            let summary = '';
            if (entry.summary && entry.summary.$t) {
                summary = entry.summary.$t.replace(/<[^>]*>/g, '').trim();
            } else if (entry.content && entry.content.$t) {
                summary = entry.content.$t.replace(/<[^>]*>/g, '').trim();
            }
            
            if (summary.length > 150) {
                summary = summary.substring(0, 150) + '...';
            }
            
            if (!summary) {
                summary = 'Descubre más sobre este interesante artículo de desarrollo y tecnología.';
            }
            
            // Extraer imagen del contenido
            let imageUrl = null;
            if (entry.content && entry.content.$t) {
                imageUrl = extractImageFromContent(entry.content.$t);
            }
            if (!imageUrl && entry.summary && entry.summary.$t) {
                imageUrl = extractImageFromContent(entry.summary.$t);
            }
            
            // Crear el elemento de la tarjeta
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            const imageContent = imageUrl 
                ? `<img src="${imageUrl}" alt="${title}" onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'>📝</div>'">` 
                : '<div class="image-placeholder">📝</div>';
            
            card.innerHTML = `
                <div class="blog-image">
                    ${imageContent}
                </div>
                <div class="blog-content">
                    <div class="blog-date">
                        📅 ${published}
                    </div>
                    <h3 class="blog-title">${title}</h3>
                    <p class="blog-summary">${summary}</p>
                    <a href="${link}" target="_blank" class="blog-link">
                        Leer más <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
            
            return card;
        }
        
        function loadBlogPosts() {
            const container = document.getElementById('blog-container');
            const stats = document.getElementById('stats');
            
            console.log('🔄 Cargando las últimas 4 entradas...');
            
            // Mostrar loading
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        Cargando las últimas 4 entradas...
                    </div>
                </div>
            `;
            stats.style.display = 'none';
            
            // Intentar múltiples métodos
            const methods = [
                // Método 1: Feed directo
                () => {
                    const feedUrl = 'https://moglidev.blogspot.com/feeds/posts/default?alt=json&max-results=4';
                    return fetch(feedUrl);
                },
                // Método 2: Proxy AllOrigins
                () => {
                    const feedUrl = 'https://moglidev.blogspot.com/feeds/posts/default?alt=json&max-results=4';
                    return fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`);
                },
                // Método 3: Proxy alternativo
                () => {
                    const feedUrl = 'https://moglidev.blogspot.com/feeds/posts/default?alt=json&max-results=4';
                    return fetch(`https://corsproxy.io/?${encodeURIComponent(feedUrl)}`);
                }
            ];
            
            tryMethods(methods, 0);
        }
        
        function tryMethods(methods, index) {
            if (index >= methods.length) {
                showError();
                return;
            }
            
            console.log(`Intentando método ${index + 1}...`);
            
            methods[index]()
                .then(response => response.json())
                .then(data => {
                    let feedData = data;
                    
                    // Si es respuesta de AllOrigins, extraer contents
                    if (data.contents) {
                        feedData = JSON.parse(data.contents);
                    }
                    
                    if (feedData.feed && feedData.feed.entry && feedData.feed.entry.length > 0) {
                        displayPosts(feedData);
                        console.log(`✅ Método ${index + 1} funcionó!`);
                    } else {
                        throw new Error('No entries found');
                    }
                })
                .catch(error => {
                    console.log(`❌ Método ${index + 1} falló:`, error);
                    tryMethods(methods, index + 1);
                });
        }
        
        function displayPosts(feedData) {
            const container = document.getElementById('blog-container');
            const stats = document.getElementById('stats');
            
            // Crear grid de tarjetas
            const grid = document.createElement('div');
            grid.className = 'blog-grid';
            
            // Crear tarjetas para las últimas 4 entradas
            feedData.feed.entry.slice(0, 4).forEach((entry, index) => {
                const card = createBlogCard(entry, index);
                grid.appendChild(card);
            });
            
            container.innerHTML = '';
            container.appendChild(grid);
            
            // Mostrar estadísticas
            stats.style.display = 'block';
            stats.innerHTML = `
                <p>✅ <strong>${feedData.feed.entry.slice(0, 4).length} entradas más recientes</strong> cargadas desde MogliDev</p>
                <p style="margin-top: 8px; font-size: 0.9rem; opacity: 0.8;">
                    🕒 Cargado: ${new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            `;
            
            // Actualizar timestamp del botón
            updateLastUpdateTime();
        }
        
        function showError() {
            const container = document.getElementById('blog-container');
            container.innerHTML = `
                <div class="error-card">
                    <h3>⚠️ Problema temporal de conexión</h3>
                    <p>Los servicios externos pueden estar sobrecargados. Mientras tanto:</p>
                    <div style="margin: 20px 0;">
                        <a href="https://moglidev.blogspot.com/" target="_blank" style="display: inline-block; background: var(--secondary); color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; margin: 5px;">
                            🔗 Ver Blog Completo
                        </a>
                        <button class="btn-reload" onclick="forceReload()" style="margin: 5px;">
                            🔄 Intentar de nuevo
                        </button>
                    </div>
                    <div style="background: rgba(162, 0, 255, 0.1); padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid rgba(162, 0, 255, 0.3);">
                        <strong>💡 Contenido del blog MogliDev:</strong>
                        <ul style="text-align: left; margin-top: 10px; color: #cccccc;">
                            <li>Tutoriales de desarrollo web y móvil</li>
                            <li>Guías de programación y mejores prácticas</li>
                            <li>Proyectos y casos de estudio técnicos</li>
                            <li>Herramientas y recursos para desarrolladores</li>
                        </ul>
                    </div>
                </div>
            `;
            
            // Quitar estado de loading del botón
            const reloadBtn = document.getElementById('reloadBtn');
            if (reloadBtn) {
                reloadBtn.classList.remove('loading');
                reloadBtn.disabled = false;
                reloadBtn.innerHTML = '🔄 Recargar Últimas 4 Entradas';
            }
        }
        
        function forceReload() {
            console.log('🚀 Forzando recarga de las últimas 4 entradas...');
            
            const reloadBtn = document.getElementById('reloadBtn');
            
            // Deshabilitar botón durante la carga
            if (reloadBtn) {
                reloadBtn.classList.add('loading');
                reloadBtn.disabled = true;
                reloadBtn.innerHTML = '⏳ Recargando...';
            }
            
            // Recargar inmediatamente
            loadBlogPosts();
            
            // Restaurar botón después de un tiempo
            setTimeout(() => {
                if (reloadBtn) {
                    reloadBtn.classList.remove('loading');
                    reloadBtn.disabled = false;
                    reloadBtn.innerHTML = '🔄 Recargar Últimas 4 Entradas';
                }
            }, 3000);
        }
        
        function updateLastUpdateTime() {
            const lastUpdateEl = document.getElementById('lastUpdate');
            if (lastUpdateEl) {
                const now = new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                lastUpdateEl.textContent = `Última actualización: ${now}`;
            }
        }
        
        // Preloader
        window.addEventListener('load', function() {
            setTimeout(function() {
                const preloader = document.getElementById('preloader');
                preloader.style.opacity = '0';
                document.body.classList.add('loaded');
                
                setTimeout(function() {
                    preloader.style.display = 'none';
                }, 500);
            }, 2500);
        });
        
        // Mobile menu toggle
        const hamburger = document.querySelector(".hamburger");
        const navMenu = document.querySelector(".nav-menu");
        
        hamburger.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });
        
        // Close mobile menu when clicking on a nav link
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("active");
            });
        });
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    navMenu.classList.remove('active');
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Cargar entradas del blog al cargar la página
        window.addEventListener('load', () => {
            console.log('🌟 Página cargada, iniciando carga de entradas del blog...');
            setTimeout(() => {
                forceReload();
            }, 3500); // Después del preloader
        });
        
        // Auto-reload cada 15 minutos (opcional)
        setInterval(() => {
            console.log('⏰ Auto-recarga programada de las últimas 4 entradas...');
            loadBlogPosts();
        }, 15 * 60 * 1000);

        // JavaScript para controlar el modal
        document.addEventListener('DOMContentLoaded', function() {
            var modal = document.getElementById("whatsappModal");
            var btn = document.getElementById("whatsappBtn");
            var span = document.getElementsByClassName("close")[0];
            
            // Abrir modal al hacer clic en el botón de Solicitar Consulta
            btn.onclick = function(e) {
                e.preventDefault();
                modal.style.display = "block";
                generateQRCode();
            }
            
            // Cerrar modal al hacer clic en la X
            span.onclick = function() {
                modal.style.display = "none";
            }
            
            // Cerrar modal al hacer clic fuera del contenido
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }
            
            // Cerrar modal con la tecla ESC
            document.addEventListener('keydown', function(event) {
                if (event.key === "Escape") {
                    modal.style.display = "none";
                }
            });
            
            // Generar código QR
            function generateQRCode() {
                const canvas = document.getElementById('qrCanvas');
                const ctx = canvas.getContext('2d');
                
                // Tamaño del QR
                canvas.width = 200;
                canvas.height = 200;
                
                // Limpiar canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Dibujar fondo
                ctx.fillStyle = '#25d366';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Dibujar patrón de QR simple (en una implementación real, usarías una librería)
                ctx.fillStyle = 'white';
                
                // Patrón de esquinas
                ctx.fillRect(10, 10, 50, 50);
                ctx.fillRect(10, 140, 50, 50);
                ctx.fillRect(140, 10, 50, 50);
                
                // Patrón de logo de WhatsApp
                ctx.font = '80px Arial';
                ctx.fillText('✓', 70, 130);
            }
            
            // Generar el QR inicial
            generateQRCode();
        });

 
    // Función para extraer imagen del contenido HTML
    function extractImageFromContent(content) {
        const imgRegex = /<img[^>]+src="([^">]+)"/i;
        const match = content.match(imgRegex);
        
        if (match && match[1]) {
            let imgUrl = match[1];
            if (imgUrl.includes('googleusercontent.com') || imgUrl.includes('blogspot.com')) {
                imgUrl = imgUrl.replace(/=s\d+-c/, '=s400-c');
                imgUrl = imgUrl.replace(/=w\d+-h\d+/, '=w400-h200');
            }
            return imgUrl;
        }
        return null;
    }

    function createBlogCard(entry, index) {
        const title = entry.title.$t;
        const link = entry.link.find(l => l.rel === 'alternate').href;
        const published = new Date(entry.published.$t).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        let summary = '';
        if (entry.summary && entry.summary.$t) {
            summary = entry.summary.$t.replace(/<[^>]*>/g, '').trim();
        } else if (entry.content && entry.content.$t) {
            summary = entry.content.$t.replace(/<[^>]*>/g, '').trim();
        }
        if (summary.length > 150) summary = summary.substring(0, 150) + '...';
        if (!summary) summary = 'Descubre más sobre este interesante artículo de desarrollo y tecnología.';

        let imageUrl = null;
        if (entry.content && entry.content.$t) imageUrl = extractImageFromContent(entry.content.$t);
        if (!imageUrl && entry.summary && entry.summary.$t) imageUrl = extractImageFromContent(entry.summary.$t);

        const card = document.createElement('div');
        card.className = 'blog-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const imageContent = imageUrl 
            ? `<img src="${imageUrl}" alt="${title}" onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'>📝</div>'">` 
            : '<div class="image-placeholder">📝</div>';

        card.innerHTML = `
            <div class="blog-image">${imageContent}</div>
            <div class="blog-content">
                <div class="blog-date">📅 ${published}</div>
                <h3 class="blog-title">${title}</h3>
                <p class="blog-summary">${summary}</p>
                <a href="${link}" target="_blank" class="blog-link">
                    Leer más <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        return card;
    }

    function loadBlogPosts() {
        const container = document.getElementById('blog-container');
        const stats = document.getElementById('stats');
        container.innerHTML = `<div class="loading-container"><div class="loading"><div class="loading-spinner"></div>Cargando las últimas 4 entradas...</div></div>`;
        stats.style.display = 'none';

        const methods = [
            () => fetch('https://moglidev.blogspot.com/feeds/posts/default?alt=json&max-results=4'),
            () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://moglidev.blogspot.com/feeds/posts/default?alt=json&max-results=4')}`),
            () => fetch(`https://corsproxy.io/?${encodeURIComponent('https://moglidev.blogspot.com/feeds/posts/default?alt=json&max-results=4')}`)
        ];
        tryMethods(methods, 0);
    }

    function tryMethods(methods, index) {
        if (index >= methods.length) return showError();
        methods[index]()
            .then(r => r.json())
            .then(data => {
                let feedData = data.contents ? JSON.parse(data.contents) : data;
                if (feedData.feed && feedData.feed.entry && feedData.feed.entry.length > 0) {
                    displayPosts(feedData);
                } else throw new Error('No entries found');
            })
            .catch(() => tryMethods(methods, index + 1));
    }

    function displayPosts(feedData) {
        const container = document.getElementById('blog-container');
        const stats = document.getElementById('stats');
        const grid = document.createElement('div');
        grid.className = 'blog-grid';
        feedData.feed.entry.slice(0, 4).forEach((entry, index) => {
            const card = createBlogCard(entry, index);
            grid.appendChild(card);
        });
        container.innerHTML = '';
        container.appendChild(grid);
        stats.style.display = 'block';
        updateLastUpdateTime();
    }

    function showError() {
        document.getElementById('blog-container').innerHTML = `
            <div class="error-card">
                <h3>⚠️ Problema temporal de conexión</h3>
                <p>Los servicios externos pueden estar sobrecargados.</p>
                <a href="https://moglidev.blogspot.com/" target="_blank" class="btn">🔗 Ver Blog Completo</a>
            </div>`;
    }

    function forceReload() {
        loadBlogPosts();
        setTimeout(() => updateLastUpdateTime(), 3000);
    }

    function updateLastUpdateTime() {
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = `Última actualización: ${new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
        }
    }

    // Auto-carga al iniciar
    window.addEventListener('load', () => {
        setTimeout(() => forceReload(), 3500);
    });
    setInterval(() => loadBlogPosts(), 15 * 60 * 1000); 

    // Funcionalidad para el modal de WhatsApp
        document.addEventListener('DOMContentLoaded', function() {
            const whatsappBtn = document.getElementById('whatsappBtn');
            const whatsappModal = document.getElementById('whatsappModal');
            const closeModal = document.querySelector('.close');
            
            // Abrir modal al hacer clic en el botón
            whatsappBtn.addEventListener('click', function(e) {
                e.preventDefault();
                whatsappModal.style.display = 'block';
            });
            
            // Cerrar modal al hacer clic en la X
            closeModal.addEventListener('click', function() {
                whatsappModal.style.display = 'none';
            });
            
            // Cerrar modal al hacer clic fuera del contenido
            window.addEventListener('click', function(e) {
                if (e.target === whatsappModal) {
                    whatsappModal.style.display = 'none';
                }
            });
            
            // Cerrar modal con la tecla Escape
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && whatsappModal.style.display === 'block') {
                    whatsappModal.style.display = 'none';
                }
            });
        });