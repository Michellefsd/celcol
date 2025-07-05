const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Crear un cliente con un avión asociado
  const cliente = await prisma.cliente.create({
    data: {
      nombre: 'Luis Gómez',
      email: 'luis@example.com',
      telefono: '099123456',
      aviones: {
        create: {
          avion: {
            create: {
              modelo: 'Cessna 172',
              marca: 'Cessna',
              matricula: 'CX-ABC',
              anio: 1998
            }
          }
        }
      }
    },
    include: {
      aviones: {
        include: {
          avion: true
        }
      }
    }
  });

  console.log('Cliente creado con avión asociado:');
  console.dir(cliente, { depth: null });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
