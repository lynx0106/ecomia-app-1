#!/usr/bin/env node

/**
 * Script para popular la base de datos con datos de ejemplo
 * Uso: node scripts/seed-example.js
 * 
 * Required env vars:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
  try {
    console.log('🌱 Iniciando seed de datos de ejemplo...\n');

    // 1. Crear o usar un usuario de prueba
    // Para este ejemplo, usaremos un UUID fijo como user_id
    const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // UUID de ejemplo

    // 2. Crear una tienda de ejemplo
    console.log('📦 Creando tienda de ejemplo...');
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        user_id: userId,
        name: 'Mi Tienda Ejemplo',
        slug: 'mi-tienda-ejemplo',
        status: 'active',
        meta: {
          tagline: 'Tu tienda de prueba para probar EcomIA',
          description: 'Una tienda de ejemplo creada por el script de seed',
          support_whatsapp: '+1234567890',
          shipping_note: 'Envíos a nivel nacional en 2-3 días hábiles',
          checkout: {
            enabled: false, // desactivado sin MercadoPago token
            price_cop: 0,
          },
        },
      })
      .select()
      .single();

    if (storeError) {
      console.error('❌ Error creando tienda:', storeError.message);
      return;
    }

    const storeId = storeData.id;
    console.log(`✅ Tienda creada: ${storeData.name} (ID: ${storeId})\n`);

    // 3. Crear una landing page de ejemplo
    console.log('🎨 Creando landing page de ejemplo...');
    const { data: landingData, error: landingError } = await supabase
      .from('landing_pages')
      .insert({
        user_id: userId,
        store_id: storeId,
        title: 'Mi Primer Landing',
        slug: 'mi-primer-landing',
        status: 'published',
        content: {
          hero: {
            title: '¡Bienvenido a EcomIA!',
            subtitle: 'Crea, gestiona y escala tu negocio con inteligencia artificial',
            cta: 'Comenzar ahora',
          },
          theme: {
            accent: '#10b981', // emerald
          },
          media: {
            hero_image_url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80',
          },
          legal: {
            business_name: 'EcomIA - Asesoría E-commerce',
            contact_email: 'contacto@ecomia.com',
            terms_url: 'https://example.com/terms',
            privacy_url: 'https://example.com/privacy',
            refund_url: 'https://example.com/refunds',
            notice: '© 2026 EcomIA. Todos los derechos reservados.',
          },
          raw: `
- 🚀 Crea tu tienda en minutos
- 📊 Gestiona inventario en tiempo real
- 💰 Pagos seguros con MercadoPago
- 📈 Análisis de ventas y tendencias
- 🤖 Asistente IA para marketing
          `.trim(),
          checkout: {
            enabled: false,
            price_cop: 0,
            product_name: 'Mi Producto Ejemplo',
          },
        },
      })
      .select()
      .single();

    if (landingError) {
      console.error('❌ Error creando landing:', landingError.message);
      return;
    }

    const landingId = landingData.id;
    console.log(`✅ Landing creada: ${landingData.title} (ID: ${landingId})\n`);

    // 4. Mostrar URLs de acceso
    console.log('🎯 URLs para acceder:\n');
    console.log(`📍 Landing Page: http://localhost:3000/l/mi-primer-landing`);
    console.log(`🏪 Tienda: http://localhost:3000/s/mi-tienda-ejemplo\n`);

    console.log('✨ ¡Seed completado! Puedes ver el contenido en el navegador.\n');
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
  }
}

seed();
