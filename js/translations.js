// Multi-language Translation System
const translations = {
    en: {
        // Navigation
        nav: {
            overview: "Overview",
            properties: "Properties",
            checklists: "Checklists",
            calendar: "Calendar",
            team: "Team",
            reports: "Reports",
            integrations: "Integrations",
            notifications: "Notifications",
            billing: "Billing"
        },
        
        // Common
        common: {
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            add: "Add",
            close: "Close",
            search: "Search",
            filter: "Filter",
            export: "Export",
            import: "Import",
            download: "Download",
            upload: "Upload",
            submit: "Submit",
            back: "Back",
            next: "Next",
            previous: "Previous",
            yes: "Yes",
            no: "No",
            confirm: "Confirm",
            view: "View",
            actions: "Actions",
            status: "Status",
            date: "Date",
            time: "Time",
            total: "Total",
            subtotal: "Subtotal",
            tax: "Tax",
            discount: "Discount",
            loading: "Loading...",
            noData: "No data available"
        },
        
        // Dashboard
        dashboard: {
            welcome: "Welcome to Host Helper Clean",
            todaySchedule: "Today's Schedule",
            upcomingCleanings: "Upcoming Cleanings",
            recentActivity: "Recent Activity",
            quickActions: "Quick Actions",
            scheduleNewCleaning: "Schedule New Cleaning",
            viewAllBookings: "View All Bookings",
            totalProperties: "Total Properties",
            activeCleanings: "Active Cleanings",
            completedToday: "Completed Today",
            revenue: "Revenue This Month"
        },
        
        // Properties
        properties: {
            myProperties: "My Properties",
            addProperty: "Add Property",
            propertyName: "Property Name",
            address: "Address",
            bedrooms: "Bedrooms",
            bathrooms: "Bathrooms",
            squareFeet: "Square Feet",
            cleaningDuration: "Cleaning Duration",
            specialInstructions: "Special Instructions",
            propertyType: "Property Type",
            apartment: "Apartment",
            house: "House",
            condo: "Condo",
            villa: "Villa"
        },
        
        // Bookings
        bookings: {
            newBooking: "New Booking",
            selectProperty: "Select Property",
            selectDate: "Select Date",
            selectTime: "Select Time",
            selectCleaner: "Select Cleaner",
            cleaningType: "Cleaning Type",
            standardCleaning: "Standard Cleaning",
            deepCleaning: "Deep Cleaning",
            moveInOut: "Move In/Out",
            priority: "Priority/Rush",
            additionalServices: "Additional Services",
            windowCleaning: "Window Cleaning",
            laundryService: "Laundry Service",
            dishwashing: "Dishwashing",
            ovenCleaning: "Oven Cleaning",
            fridgeCleaning: "Fridge Cleaning",
            totalPrice: "Total Price",
            bookingConfirmed: "Booking Confirmed",
            bookingCancelled: "Booking Cancelled"
        },
        
        // Team
        team: {
            myTeam: "My Team",
            addTeamMember: "Add Team Member",
            cleanerMarketplace: "Cleaner Marketplace",
            name: "Name",
            email: "Email",
            phone: "Phone",
            role: "Role",
            rating: "Rating",
            completedCleanings: "Completed Cleanings",
            availability: "Availability",
            hourlyRate: "Hourly Rate",
            hire: "Hire",
            message: "Message",
            viewProfile: "View Profile"
        },
        
        // Notifications
        notifications: {
            emailSMS: "Email & SMS Notifications",
            notificationSettings: "Notification Settings",
            emailConfiguration: "Email Configuration",
            smsConfiguration: "SMS Configuration",
            automatedTriggers: "Automated Notification Triggers",
            bookingConfirmation: "Booking Confirmation",
            reminder24Hour: "24-Hour Reminder",
            cleaningStarted: "Cleaning Started",
            cleaningCompleted: "Cleaning Completed",
            paymentProcessed: "Payment Processed",
            weeklySummary: "Weekly Summary",
            sendTestNotification: "Send Test Notification",
            notificationHistory: "Notification History",
            recipient: "Recipient",
            channel: "Channel",
            sent: "Sent",
            failed: "Failed",
            pending: "Pending"
        },
        
        // Calendar
        calendar: {
            cleaningCalendar: "Cleaning Calendar",
            monthView: "Month View",
            weekView: "Week View",
            dayView: "Day View",
            today: "Today",
            addBooking: "Add Booking",
            dragToReschedule: "Drag to reschedule",
            clickToViewDetails: "Click to view details"
        },
        
        // Reports
        reports: {
            analyticsRevenue: "Analytics & Revenue",
            dateRange: "Date Range",
            last7Days: "Last 7 Days",
            last30Days: "Last 30 Days",
            last90Days: "Last 90 Days",
            lastYear: "Last Year",
            custom: "Custom",
            exportReport: "Export Report",
            totalRevenue: "Total Revenue",
            platformFees: "Platform Fees",
            cleanerPayouts: "Cleaner Payouts",
            netProfit: "Net Profit",
            bookingTrends: "Booking Trends",
            topProperties: "Top Properties",
            cleanerPerformance: "Cleaner Performance",
            customerInsights: "Customer Insights",
            averageRating: "Average Rating",
            repeatRate: "Repeat Rate",
            responseTime: "Average Response Time"
        },
        
        // Owner Portal
        ownerPortal: {
            welcomeBack: "Welcome Back",
            myProperties: "My Properties",
            bookingHistory: "Booking History",
            liveTracking: "Live Tracking",
            propertyAnalytics: "Property Analytics",
            scheduleNewCleaning: "Schedule New Cleaning",
            viewDetails: "View Details",
            cleaningInProgress: "Cleaning in Progress",
            noActiveCleanings: "No cleanings in progress right now",
            upcomingBookings: "Upcoming Bookings",
            completedBookings: "Completed Bookings",
            cancelledBookings: "Cancelled Bookings",
            rateThisCleaning: "Rate This Cleaning",
            contactCleaner: "Contact Cleaner",
            trackingDetails: "Tracking Details",
            cleanerArrived: "Cleaner Arrived",
            cleaningStarted: "Cleaning Started",
            photoVerification: "Photo Verification",
            completed: "Completed"
        },
        
        // Messages
        messages: {
            success: {
                saved: "Saved successfully!",
                deleted: "Deleted successfully!",
                updated: "Updated successfully!",
                sent: "Sent successfully!",
                bookingCreated: "Booking created successfully!",
                bookingCancelled: "Booking cancelled successfully!",
                teamMemberAdded: "Team member added successfully!",
                propertyAdded: "Property added successfully!"
            },
            error: {
                general: "An error occurred. Please try again.",
                required: "Please fill in all required fields.",
                invalidEmail: "Please enter a valid email address.",
                invalidPhone: "Please enter a valid phone number.",
                invalidDate: "Please select a valid date.",
                pastDate: "Please select a future date.",
                noAvailability: "No cleaners available for this time."
            },
            confirm: {
                delete: "Are you sure you want to delete this?",
                cancel: "Are you sure you want to cancel this booking?",
                logout: "Are you sure you want to logout?"
            }
        }
    },
    
    es: {
        // Navigation
        nav: {
            overview: "Resumen",
            properties: "Propiedades",
            checklists: "Listas de verificación",
            calendar: "Calendario",
            team: "Equipo",
            reports: "Informes",
            integrations: "Integraciones",
            notifications: "Notificaciones",
            billing: "Facturación"
        },
        
        // Common
        common: {
            save: "Guardar",
            cancel: "Cancelar",
            delete: "Eliminar",
            edit: "Editar",
            add: "Agregar",
            close: "Cerrar",
            search: "Buscar",
            filter: "Filtrar",
            export: "Exportar",
            import: "Importar",
            download: "Descargar",
            upload: "Subir",
            submit: "Enviar",
            back: "Atrás",
            next: "Siguiente",
            previous: "Anterior",
            yes: "Sí",
            no: "No",
            confirm: "Confirmar",
            view: "Ver",
            actions: "Acciones",
            status: "Estado",
            date: "Fecha",
            time: "Hora",
            total: "Total",
            subtotal: "Subtotal",
            tax: "Impuesto",
            discount: "Descuento",
            loading: "Cargando...",
            noData: "No hay datos disponibles"
        },
        
        // Dashboard
        dashboard: {
            welcome: "Bienvenido a Host Helper Clean",
            todaySchedule: "Horario de Hoy",
            upcomingCleanings: "Próximas Limpiezas",
            recentActivity: "Actividad Reciente",
            quickActions: "Acciones Rápidas",
            scheduleNewCleaning: "Programar Nueva Limpieza",
            viewAllBookings: "Ver Todas las Reservas",
            totalProperties: "Total de Propiedades",
            activeCleanings: "Limpiezas Activas",
            completedToday: "Completadas Hoy",
            revenue: "Ingresos Este Mes"
        },
        
        // Properties
        properties: {
            myProperties: "Mis Propiedades",
            addProperty: "Agregar Propiedad",
            propertyName: "Nombre de la Propiedad",
            address: "Dirección",
            bedrooms: "Habitaciones",
            bathrooms: "Baños",
            squareFeet: "Pies Cuadrados",
            cleaningDuration: "Duración de Limpieza",
            specialInstructions: "Instrucciones Especiales",
            propertyType: "Tipo de Propiedad",
            apartment: "Apartamento",
            house: "Casa",
            condo: "Condominio",
            villa: "Villa"
        },
        
        // Continue with more Spanish translations...
        bookings: {
            newBooking: "Nueva Reserva",
            selectProperty: "Seleccionar Propiedad",
            selectDate: "Seleccionar Fecha",
            selectTime: "Seleccionar Hora",
            selectCleaner: "Seleccionar Limpiador",
            cleaningType: "Tipo de Limpieza",
            standardCleaning: "Limpieza Estándar",
            deepCleaning: "Limpieza Profunda",
            moveInOut: "Mudanza",
            priority: "Prioridad/Urgente",
            additionalServices: "Servicios Adicionales",
            windowCleaning: "Limpieza de Ventanas",
            laundryService: "Servicio de Lavandería",
            dishwashing: "Lavado de Platos",
            ovenCleaning: "Limpieza de Horno",
            fridgeCleaning: "Limpieza de Refrigerador",
            totalPrice: "Precio Total",
            bookingConfirmed: "Reserva Confirmada",
            bookingCancelled: "Reserva Cancelada"
        }
    },
    
    fr: {
        // Navigation
        nav: {
            overview: "Aperçu",
            properties: "Propriétés",
            checklists: "Listes de contrôle",
            calendar: "Calendrier",
            team: "Équipe",
            reports: "Rapports",
            integrations: "Intégrations",
            notifications: "Notifications",
            billing: "Facturation"
        },
        
        // Common
        common: {
            save: "Enregistrer",
            cancel: "Annuler",
            delete: "Supprimer",
            edit: "Modifier",
            add: "Ajouter",
            close: "Fermer",
            search: "Rechercher",
            filter: "Filtrer",
            export: "Exporter",
            import: "Importer",
            download: "Télécharger",
            upload: "Téléverser",
            submit: "Soumettre",
            back: "Retour",
            next: "Suivant",
            previous: "Précédent",
            yes: "Oui",
            no: "Non",
            confirm: "Confirmer",
            view: "Voir",
            actions: "Actions",
            status: "Statut",
            date: "Date",
            time: "Heure",
            total: "Total",
            subtotal: "Sous-total",
            tax: "Taxe",
            discount: "Réduction",
            loading: "Chargement...",
            noData: "Aucune donnée disponible"
        }
    },
    
    pt: {
        // Navigation
        nav: {
            overview: "Visão Geral",
            properties: "Propriedades",
            checklists: "Listas de Verificação",
            calendar: "Calendário",
            team: "Equipe",
            reports: "Relatórios",
            integrations: "Integrações",
            notifications: "Notificações",
            billing: "Faturamento"
        },
        
        // Common
        common: {
            save: "Salvar",
            cancel: "Cancelar",
            delete: "Excluir",
            edit: "Editar",
            add: "Adicionar",
            close: "Fechar",
            search: "Buscar",
            filter: "Filtrar",
            export: "Exportar",
            import: "Importar",
            download: "Baixar",
            upload: "Carregar",
            submit: "Enviar",
            back: "Voltar",
            next: "Próximo",
            previous: "Anterior",
            yes: "Sim",
            no: "Não",
            confirm: "Confirmar",
            view: "Ver",
            actions: "Ações",
            status: "Status",
            date: "Data",
            time: "Hora",
            total: "Total",
            subtotal: "Subtotal",
            tax: "Imposto",
            discount: "Desconto",
            loading: "Carregando...",
            noData: "Nenhum dado disponível"
        }
    }
};

// Current language
let currentLanguage = localStorage.getItem('language') || 'en';

// Translation function
function t(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            // Fallback to English if translation not found
            value = translations['en'];
            for (const k2 of keys) {
                if (value && value[k2]) {
                    value = value[k2];
                } else {
                    return key; // Return key if no translation found
                }
            }
            break;
        }
    }
    
    return value;
}

// Update all translations on page
function updateTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Update navigation
    updateNavigationTranslations();
    
    // Update any dynamic content
    updateDynamicTranslations();
}

// Update navigation links
function updateNavigationTranslations() {
    const navMappings = {
        'overview': 'nav.overview',
        'properties': 'nav.properties',
        'checklists': 'nav.checklists',
        'calendar': 'nav.calendar',
        'team': 'nav.team',
        'reports': 'nav.reports',
        'integrations': 'nav.integrations',
        'notifications': 'nav.notifications',
        'billing': 'nav.billing'
    };
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const page = link.getAttribute('data-page');
        if (navMappings[page]) {
            const icon = link.querySelector('i');
            const text = t(navMappings[page]);
            link.innerHTML = `${icon.outerHTML} ${text}`;
        }
    });
}

// Update dynamic content translations
function updateDynamicTranslations() {
    // Update page titles
    const pageTitles = {
        'dashboard': 'dashboard.welcome',
        'properties': 'properties.myProperties',
        'calendar': 'calendar.cleaningCalendar',
        'team': 'team.myTeam',
        'reports': 'reports.analyticsRevenue',
        'notifications': 'notifications.emailSMS',
        'billing': 'nav.billing'
    };
    
    // Update buttons
    document.querySelectorAll('.btn').forEach(button => {
        const key = button.getAttribute('data-i18n-key');
        if (key) {
            button.innerHTML = button.innerHTML.replace(/>[^<]+</, `>${t(key)}<`);
        }
    });
}

// Language change handler
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update current language display
    const langCodes = {
        'en': 'EN',
        'es': 'ES',
        'fr': 'FR',
        'pt': 'PT'
    };
    document.getElementById('currentLang').textContent = langCodes[lang];
    
    // Update active language in dropdown
    document.querySelectorAll('.language-dropdown a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(lang)) {
            link.classList.add('active');
        }
    });
    
    // Close language dropdown
    document.getElementById('languageDropdown').classList.remove('active');
    
    // Update all translations
    updateTranslations();
    
    // Show notification
    showNotification(t('messages.success.saved'));
}

// Toggle language menu
function toggleLanguageMenu() {
    const dropdown = document.getElementById('languageDropdown');
    dropdown.classList.toggle('active');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.language-selector')) {
        document.getElementById('languageDropdown')?.classList.remove('active');
    }
});

// Initialize translations on page load
document.addEventListener('DOMContentLoaded', function() {
    updateTranslations();
});