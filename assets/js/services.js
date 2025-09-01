// Navegación suave
        document.querySelectorAll('.nav-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const section = dot.getAttribute('data-section');
                const element = document.getElementById(section);
                element.scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Actualizar indicador de navegación al hacer scroll
        window.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('.section');
            const scrollPos = window.scrollY + window.innerHeight / 2;

            sections.forEach(section => {
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos <= bottom) {
                    document.querySelectorAll('.nav-dot').forEach(dot => {
                        dot.classList.remove('active');
                        if (dot.getAttribute('data-section') === id) {
                            dot.classList.add('active');
                        }
                    });
                }
            });
        });

        // Animación de aparición al hacer scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Aplicar animación a las tarjetas
        document.querySelectorAll('.service-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(card);
        });

        // Mobile Menu Toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.setAttribute('aria-expanded', 
                    hamburger.getAttribute('aria-expanded') === 'false' ? 'true' : 'false');
            });
        }
        
        // Cerrar menú al hacer clic en un enlace
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu) navMenu.classList.remove('active');
                if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
            });
        });


        